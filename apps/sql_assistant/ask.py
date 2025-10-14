#!/usr/bin/env python3
"""
ask.py — Natural Language → SQL CLI (SQLite/Postgres) using an OpenAI-compatible LLM server

Features
- Works with your local LLM gateway (OpenAI Chat Completions API compatible)
- Connects to SQLite or PostgreSQL via SQLAlchemy
- Introspects DB schema and passes a concise snapshot to the LLM
- LLM produces a SINGLE safe, read-only SELECT query in JSON
- Executes the SQL, then asks the LLM to summarize the results to answer the user’s question
- Read-only safeguards (rejects DDL/DML; SQLite read-only mode; optional table whitelist)
- Self-repair loop (retry invalid SQL with error feedback, up to N attempts)
- CLI flags: --db, --model, --sql-only, --dry-run, --verbose, --max-rows, --repair-attempts, etc.

Usage
  export LLM_BASE_URL="http://nodo4:9000/v1"
  export LLM_API_KEY="none"  # or proper key if you add auth later
  export DB_URL="sqlite:///file:./mezclas_dummy.db?mode=ro&uri=true"
  # Postgres example (use a read-only user):
  # export DB_URL="postgresql+psycopg2://readonly_user:***@localhost:5432/mydb"

  python ask.py "Give me a review of what the database consists"
  python ask.py "Top 10 customers by total orders in 2024"

Install
  pip install --upgrade "sqlalchemy>=2" pandas openai psycopg2-binary

Notes
- For SQLite, the recommended read-only DSN is the URI form above.
- For PostgreSQL, create a user with SELECT-only privileges.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import textwrap
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import inspect as sa_inspect

try:
    from openai import OpenAI
except Exception:
    print("[fatal] The 'openai' package is required. Install with: pip install openai", file=sys.stderr)
    raise

import httpx


# ---------------------------
# LLM client helper
# ---------------------------
@dataclass
class LLMConfig:
    base_url: str
    api_key: str
    model: str
    max_tokens: int = 512


def llm_client(cfg: LLMConfig) -> OpenAI:
    """Create an OpenAI client. By default, bypass system HTTP proxies so local
    hosts like nodo4:9000 or 127.0.0.1 don't get intercepted by corporate Squid.
    Set ASKSQ L_NO_PROXY=0 to allow proxies again if you really need them.
    """
    disable_proxy = os.getenv("ASKSQL_NO_PROXY", "1") == "1"
    if disable_proxy:
        http_client = httpx.Client(trust_env=False, timeout=60.0)
        return OpenAI(base_url=cfg.base_url, api_key=cfg.api_key, http_client=http_client)
    return OpenAI(base_url=cfg.base_url, api_key=cfg.api_key)


def chat_json(
    cfg: LLMConfig,
    messages: List[Dict[str, str]],
    response_format_json: bool = True,
    temperature: float = 0.2,
) -> Dict[str, Any]:
    """Call the LLM and parse JSON content.
    Falls back to extracting a JSON block if the server ignores response_format.
    """
    client = llm_client(cfg)

    kwargs: Dict[str, Any] = dict(
        model=cfg.model,
        messages=messages,
        max_tokens=cfg.max_tokens,
        temperature=temperature,
    )
    if response_format_json:
        kwargs["response_format"] = {"type": "json_object"}

    resp = client.chat.completions.create(**kwargs)
    content = resp.choices[0].message.content or "{}"

    # Try direct JSON first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Try to extract a JSON block from arbitrary text
    m = re.search(r"\{[\s\S]*\}\s*$", content)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    # Try to extract from code fence
    m = re.search(r"```json\s*([\s\S]*?)```", content)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"LLM did not return JSON. Raw content was:\n{content}")


# ---------------------------
# DB / Schema helpers
# ---------------------------
FORBIDDEN_SQL_PATTERNS = re.compile(
    r"\b(UPDATE|DELETE|INSERT|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|TRUNCATE|GRANT|REVOKE|COPY)\b",
    re.IGNORECASE,
)


def build_engine(db_url: str) -> Engine:
    # If SQLite file path without read-only flags, add them (safe default)
    if db_url.startswith("sqlite///") or db_url.startswith("sqlite:///"):
        # If already a URI with query, respect it
        if "?" not in db_url and not db_url.startswith("sqlite:///file:"):
            # Convert to URI form with read-only
            path = db_url[len("sqlite:///") :]
            db_url = f"sqlite:///file:{path}?mode=ro&uri=true"
    engine = create_engine(db_url, future=True)
    return engine


def detect_dialect(engine: Engine) -> str:
    name = engine.dialect.name.lower()
    if name.startswith("postgres"):
        return "postgresql"
    return name  # e.g., 'sqlite'


def get_schema_snapshot(
    engine: Engine,
    tables_whitelist: Optional[List[str]] = None,
    max_tables: int = 30,
    sample_rows: int = 2,
    max_chars: int = 6000,
) -> Tuple[Dict[str, Any], str]:
    """Return (schema_dict, schema_prompt_str). Limits size to keep prompts small."""
    insp = sa_inspect(engine)
    all_tables = insp.get_table_names()
    if tables_whitelist:
        tables = [t for t in all_tables if t in set(tables_whitelist)]
    else:
        tables = all_tables[:max_tables]

    schema: Dict[str, Any] = {"tables": []}

    with engine.connect() as conn:
        # SQLite extra safety (query only)
        if engine.dialect.name == "sqlite":
            try:
                conn.exec_driver_sql("PRAGMA query_only = ON")
            except SQLAlchemyError:
                pass

        for t in tables:
            cols = []
            for c in insp.get_columns(t):
                cols.append(
                    {
                        "name": c.get("name"),
                        "type": str(c.get("type")),
                        "nullable": bool(c.get("nullable", True)),
                    }
                )
            pk = insp.get_pk_constraint(t).get("constrained_columns") or []
            fks = [
                {
                    "constrained_columns": fk.get("constrained_columns"),
                    "referred_table": fk.get("referred_table"),
                    "referred_columns": fk.get("referred_columns"),
                }
                for fk in insp.get_foreign_keys(t)
            ]

            # Row count (best-effort, ignore errors for huge/foreign tables)
            nrows = None
            try:
                nrows = conn.execute(text(f"SELECT COUNT(*) FROM \"{t}\"")).scalar_one()
            except SQLAlchemyError:
                pass

            # Small sample
            sample = []
            if sample_rows > 0:
                try:
                    q = text(f'SELECT * FROM "{t}" LIMIT {int(sample_rows)}')
                    res = conn.execute(q)
                    # Convert rows to dicts
                    sample = [dict(r._mapping) for r in res.fetchall()]
                except SQLAlchemyError:
                    pass

            schema["tables"].append(
                {
                    "name": t,
                    "columns": cols,
                    "primary_key": pk,
                    "foreign_keys": fks,
                    "row_count": nrows,
                    "sample": sample,
                }
            )

    # Prompt-friendly rendering
    lines: List[str] = []
    lines.append("You are given a database schema snapshot. Use it to write safe, correct SQL.")
    for t in schema["tables"]:
        cols_str = ", ".join([f"{c['name']} ({c['type']})" for c in t["columns"]])
        meta = []
        if t.get("row_count") is not None:
            meta.append(f"rows={t['row_count']}")
        if t.get("primary_key"):
            meta.append(f"pk={t['primary_key']}")
        header = f"- {t['name']}: {cols_str}" + (f"  [{'; '.join(meta)}]" if meta else "")
        lines.append(header)
        if t.get("sample"):
            for r in t["sample"]:
                # elide long values
                short = {k: (str(v)[:60] + ("…" if v and len(str(v)) > 60 else "")) for k, v in r.items()}
                lines.append(f"    sample → {short}")
        if sum(len(s) for s in lines) > max_chars:
            lines.append("    … (schema truncated for prompt budget)")
            break

    prompt_str = "\n".join(lines)
    return schema, prompt_str


# ---------------------------
# SQL validation and execution
# ---------------------------

def is_sql_safe(sql: str) -> bool:
    if ";" in sql:
        return False
    if FORBIDDEN_SQL_PATTERNS.search(sql):
        return False
    if not re.search(r"^\s*SELECT\b", sql, re.IGNORECASE):
        return False
    return True


def add_default_limit(sql: str, default_limit: int) -> str:
    # If no LIMIT found and appears to select full table, add a LIMIT
    if re.search(r"\bLIMIT\b", sql, re.IGNORECASE):
        return sql
    if default_limit and default_limit > 0:
        return sql.rstrip() + f"\nLIMIT {default_limit}"
    return sql


def exec_sql(engine: Engine, sql: str, max_rows: int = 5000) -> pd.DataFrame:
    with engine.connect() as conn:
        if engine.dialect.name == "sqlite":
            try:
                conn.exec_driver_sql("PRAGMA query_only = ON")
            except SQLAlchemyError:
                pass
        df = pd.read_sql_query(text(sql), conn)
        if len(df) > max_rows:
            df = df.head(max_rows)
        return df


# ---------------------------
# Prompts
# ---------------------------
GENERATOR_SYS = """
You are a senior data engineer. Convert the user's request into ONE safe, read-only SQL SELECT for the given {dialect} database.
Return ONLY JSON with keys: action, sql, reason.
- action: "query" (use SQL) or "schema_summary" (no SQL needed; answer from schema overview)
- sql: the single SQL string (empty if action=="schema_summary")
- reason: one sentence justification
Rules:
- Use only SELECT (no DDL/DML).
- No multiple statements. No semicolons.
- Use table/column names exactly as provided.
- Prefer LIMIT {default_limit} unless a smaller count is requested.
- If unsure which columns hold a concept, pick best-effort from names/samples rather than inventing new ones.
""".strip()

SUMMARIZER_SYS = """
You are a helpful data analyst. Given the user's request, the schema overview, the SQL used (if any), and the result rows, answer succinctly.
If the user asked for an overview of the database, describe tables, row counts, key columns, and notable relationships.
When the result is tabular, summarize key findings; include small inline stats if helpful. Keep it to a few paragraphs max.

ALWAYS ANSWER IN SPANISH, SIEMPRE RESPONDE EN ESPANOL.
""".strip()


# ---------------------------
# Dataclasses for service usage
# ---------------------------
@dataclass
class AskOptions:
    db_url: str
    model: str
    base_url: str
    api_key: str
    tables: Optional[List[str]] = None
    default_limit: int = 200
    max_rows: int = 5000
    sample_rows: int = 2
    repair_attempts: int = 2
    sql_only: bool = False
    dry_run: bool = False
    verbose: bool = False


@dataclass
class AskResult:
    question: str
    action: str
    reason: Optional[str]
    sql: str
    answer: str
    rows: Optional[List[Dict[str, Any]]]
    row_count: Optional[int]
    schema_prompt: str


def ask_pipeline(question: str, options: AskOptions) -> AskResult:
    cfg = LLMConfig(
        base_url=options.base_url,
        api_key=options.api_key,
        model=options.model,
        max_tokens=1024,
    )

    engine = build_engine(options.db_url)
    dialect = detect_dialect(engine)
    if options.verbose:
        print(f"[info] dialect={dialect} url={options.db_url}")

    _, schema_prompt = get_schema_snapshot(
        engine,
        tables_whitelist=options.tables,
        sample_rows=options.sample_rows,
    )

    gen = generate_sql(cfg, question, dialect, schema_prompt, options.default_limit)
    action = (gen.get("action") or "query").strip().lower()
    sql = (gen.get("sql") or "").strip()
    reason = gen.get("reason")

    if options.verbose:
        print(f"[gen] action={action} reason={reason}")
        if sql:
            print("[gen] sql:\n" + sql)

    if action == "schema_summary" or not sql:
        answer = ""
        if not options.sql_only:
            answer = summarize_answer(cfg, question, schema_prompt, sql_used="", df=None)
        return AskResult(
            question=question,
            action=action,
            reason=reason,
            sql="",
            answer=answer,
            rows=None,
            row_count=None,
            schema_prompt=schema_prompt,
        )

    if not is_sql_safe(sql):
        if options.verbose:
            print("[warn] SQL failed safety checks; attempting to repair via LLM…")
        err_msg = "SQL failed safety checks (must be single SELECT without semicolons/DDL)."
        repaired = False
        for attempt in range(options.repair_attempts):
            repair_prompt = {
                "role": "user",
                "content": textwrap.dedent(
                    f"""
                    The previous SQL was unsafe or invalid. Error: {err_msg}
                    Please return corrected JSON with a single, safe SELECT for {dialect}.

                    Original request: {question}

                    Schema:
                    {schema_prompt}
                    """
                ).strip(),
            }
            gen = chat_json(
                cfg,
                [
                    {
                        "role": "system",
                        "content": GENERATOR_SYS.format(
                            dialect=dialect, default_limit=options.default_limit
                        ),
                    },
                    repair_prompt,
                ],
            )
            action = (gen.get("action") or "query").strip().lower()
            sql = (gen.get("sql") or "").strip()
            reason = gen.get("reason")
            if options.verbose:
                print(f"[repair {attempt+1}] action={action} reason={reason}")
                if sql:
                    print("[repair] sql:\n" + sql)
            if action == "schema_summary":
                repaired = True
                break
            if sql and is_sql_safe(sql):
                repaired = True
                break
        if not repaired:
            raise RuntimeError("Could not obtain a safe SELECT query from the LLM.")
        if action == "schema_summary":
            answer = ""
            if not options.sql_only:
                answer = summarize_answer(cfg, question, schema_prompt, sql_used="", df=None)
            return AskResult(
                question=question,
                action=action,
                reason=reason,
                sql="",
                answer=answer,
                rows=None,
                row_count=None,
                schema_prompt=schema_prompt,
            )

    sql = add_default_limit(sql, options.default_limit)

    if options.sql_only:
        return AskResult(
            question=question,
            action=action,
            reason=reason,
            sql=sql,
            answer="",
            rows=None,
            row_count=None,
            schema_prompt=schema_prompt,
        )

    if options.dry_run:
        return AskResult(
            question=question,
            action=action,
            reason=reason,
            sql=sql,
            answer=f"[dry-run] would execute SQL:\n{sql}",
            rows=None,
            row_count=None,
            schema_prompt=schema_prompt,
        )

    df: Optional[pd.DataFrame]

    try:
        df = exec_sql(engine, sql, max_rows=options.max_rows)
    except SQLAlchemyError as e:
        if options.verbose:
            print(f"[exec error] {e}; attempting LLM repair with error context…")
        df = None
        err_msg = str(e)
        repaired = False
        for attempt in range(options.repair_attempts):
            repair_prompt = {
                "role": "user",
                "content": textwrap.dedent(
                    f"""
                    The SQL failed to run. DB error: {err_msg}
                    Please fix and return JSON with one safe SELECT for {dialect}.

                    Original request: {question}

                    Schema:
                    {schema_prompt}

                    Previous SQL:
                    {sql}
                    """
                ).strip(),
            }
            gen = chat_json(
                cfg,
                [
                    {
                        "role": "system",
                        "content": GENERATOR_SYS.format(
                            dialect=dialect, default_limit=options.default_limit
                        ),
                    },
                    repair_prompt,
                ],
            )
            action = (gen.get("action") or "query").strip().lower()
            candidate_sql = (gen.get("sql") or "").strip()
            reason = gen.get("reason")
            if options.verbose:
                print(f"[repair {attempt+1}] action={action} reason={reason}")
                if candidate_sql:
                    print("[repair] sql:\n" + candidate_sql)
            if action == "schema_summary":
                df = None
                sql = ""
                repaired = True
                break
            if not (candidate_sql and is_sql_safe(candidate_sql)):
                continue
            candidate_sql = add_default_limit(candidate_sql, options.default_limit)
            try:
                df = exec_sql(engine, candidate_sql, max_rows=options.max_rows)
                sql = candidate_sql
                repaired = True
                break
            except SQLAlchemyError as e2:
                err_msg = str(e2)
                continue
        if not repaired:
            raise RuntimeError("Query failed after repair attempts.")

    answer = summarize_answer(cfg, question, schema_prompt, sql_used=sql, df=df)
    rows = df.to_dict(orient="records") if df is not None else None
    row_count = len(df) if df is not None else None

    return AskResult(
        question=question,
        action=action,
        reason=reason,
        sql=sql,
        answer=answer,
        rows=rows,
        row_count=row_count,
        schema_prompt=schema_prompt,
    )


# ---------------------------
# Pipeline
# ---------------------------

def generate_sql(
    cfg: LLMConfig,
    question: str,
    dialect: str,
    schema_prompt: str,
    default_limit: int,
) -> Dict[str, Any]:
    sys_msg = {"role": "system", "content": GENERATOR_SYS.format(dialect=dialect, default_limit=default_limit)}
    usr_msg = {
        "role": "user",
        "content": textwrap.dedent(
            f"""
            User request: {question}

            Schema:
            {schema_prompt}
            """
        ).strip(),
    }
    return chat_json(cfg, [sys_msg, usr_msg], response_format_json=True, temperature=0.1)


def summarize_answer(
    cfg: LLMConfig,
    question: str,
    schema_prompt: str,
    sql_used: str,
    df: Optional[pd.DataFrame],
    max_table_rows: int = 25,
) -> str:
    # Prepare a compact representation of the result for the LLM
    payload: Dict[str, Any] = {
        "question": question,
        "sql": sql_used,
        "schema_overview": schema_prompt,
    }
    if df is not None:
        # Truncate for prompt safety
        sample = df.head(max_table_rows)
        payload["result_preview_rows"] = len(df)
        payload["result_preview_table"] = sample.to_dict(orient="records")
        # Basic quick stats per numeric column
        numeric_cols = sample.select_dtypes(include=["number"]).columns.tolist()
        if numeric_cols:
            payload["numeric_summary"] = sample[numeric_cols].describe().to_dict()

    sys_msg = {"role": "system", "content": SUMMARIZER_SYS}
    usr_msg = {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}
    client = llm_client(cfg)
    resp = client.chat.completions.create(
        model=cfg.model,
        messages=[sys_msg, usr_msg],
        max_tokens=cfg.max_tokens,
        temperature=0.3,
    )
    return resp.choices[0].message.content.strip()


# ---------------------------
# CLI
# ---------------------------

def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Ask questions of a SQL database with an LLM → SQL pipeline.")
    p.add_argument("question", help="Natural language question to ask")
    p.add_argument("--db", dest="db_url", default=os.environ.get("DB_URL", "sqlite:///file:./mezclas_dummy.db?mode=ro&uri=true"), help="SQLAlchemy DB URL")
    p.add_argument("--model", default=os.environ.get("LLM_MODEL", "local"), help="LLM model name")
    p.add_argument("--base-url", default=os.environ.get("LLM_BASE_URL", "http://nodo4:9000/v1"), help="LLM base URL")
    p.add_argument("--api-key", default=os.environ.get("LLM_API_KEY", "none"), help="LLM API key")
    p.add_argument("--tables", nargs="*", help="Whitelist of tables to expose (default: all)")
    p.add_argument("--default-limit", type=int, default=200, help="Default LIMIT appended to generated SQL when absent")
    p.add_argument("--max-rows", type=int, default=5000, help="Max result rows to keep from execution")
    p.add_argument("--sample-rows", type=int, default=2, help="Rows per table to include in schema snapshot")
    p.add_argument("--repair-attempts", type=int, default=2, help="How many times to let the LLM fix broken SQL")
    p.add_argument("--sql-only", action="store_true", help="Print only the SQL the LLM produced and exit")
    p.add_argument("--dry-run", action="store_true", help="Generate SQL but do not execute it")
    p.add_argument("--verbose", action="store_true", help="Verbose logs")

    args = p.parse_args(argv)

    options = AskOptions(
        db_url=args.db_url,
        model=args.model,
        base_url=args.base_url,
        api_key=args.api_key,
        tables=args.tables,
        default_limit=args.default_limit,
        max_rows=args.max_rows,
        sample_rows=args.sample_rows,
        repair_attempts=args.repair_attempts,
        sql_only=args.sql_only,
        dry_run=args.dry_run,
        verbose=args.verbose,
    )

    try:
        result = ask_pipeline(args.question, options)
    except RuntimeError as exc:
        print(f"[fatal] {exc}", file=sys.stderr)
        return 2
    except Exception as exc:  # pragma: no cover - unexpected
        print(f"[fatal] Unexpected error: {exc}", file=sys.stderr)
        return 3

    if args.sql_only:
        print(result.sql)
        return 0

    print(result.answer)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
