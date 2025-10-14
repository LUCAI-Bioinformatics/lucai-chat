from __future__ import annotations

import os
from typing import Dict, List, Optional
from urllib.parse import unquote

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .ask import AskOptions, AskResult, ask_pipeline


def env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Pregunta en lenguaje natural")
    sql_only: bool = False
    dry_run: bool = False
    tables: Optional[List[str]] = Field(default=None, description="Lista de tablas permitidas")
    default_limit: Optional[int] = None
    max_rows: Optional[int] = None
    sample_rows: Optional[int] = None
    repair_attempts: Optional[int] = None
    verbose: bool = False


class AskResponse(BaseModel):
    answer: str
    sql: str
    action: str
    reason: Optional[str]
    row_count: Optional[int]
    rows: Optional[List[Dict[str, object]]]
    schema_prompt: str


app = FastAPI(title="LUCAI SQL Assistant API", version="0.1.0")


@app.get("/healthz")
def healthz() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
def ask_endpoint(payload: AskRequest) -> AskResponse:
    options = AskOptions(
        db_url=os.environ.get("DB_URL", "sqlite:///file:./mezclas_dummy.db?mode=ro&uri=true"),
        model=os.environ.get("LLM_MODEL", "local"),
        base_url=os.environ.get("LLM_BASE_URL", "http://nodo4:9000/v1"),
        api_key=os.environ.get("LLM_API_KEY", "none"),
        tables=payload.tables,
        default_limit=payload.default_limit or env_int("ASK_DEFAULT_LIMIT", 200),
        max_rows=payload.max_rows or env_int("ASK_MAX_ROWS", 5000),
        sample_rows=payload.sample_rows or env_int("ASK_SAMPLE_ROWS", 2),
        repair_attempts=payload.repair_attempts or env_int("ASK_REPAIR_ATTEMPTS", 2),
        sql_only=payload.sql_only,
        dry_run=payload.dry_run,
        verbose=payload.verbose or env_bool("ASK_VERBOSE", False),
    )

    db_url = options.db_url
    if db_url.startswith("sqlite:///file:"):
        raw_path = db_url[len("sqlite:///file:") :].split("?", 1)[0]
        db_path = unquote(raw_path)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=503, detail=f"Database not found at {db_path}")

    try:
        result: AskResult = ask_pipeline(payload.question, options)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - unexpected errors
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc

    return AskResponse(
        answer=result.answer,
        sql=result.sql,
        action=result.action,
        reason=result.reason,
        row_count=result.row_count,
        rows=result.rows,
        schema_prompt=result.schema_prompt,
    )
