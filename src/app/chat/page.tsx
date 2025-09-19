"use client";
import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string>("");

  const ask = async () => {
    if (!input.trim()) return;
    setAnswer("…thinking");
    try {
      const res = await fetch("/api/chat", { method: "POST", body: input });
      const text = await res.text();
      setAnswer(res.ok ? text : `Error ${res.status}: ${text}`);
    } catch (e:any) {
      setAnswer(`Error de red: ${e?.message ?? e}`);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="header-dark">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <img src="/brand/logo.png" alt="LUCAI" width={160} height={36} />
          <span className="text-sm text-[color:var(--lu-subtle)]">MVP</span>
        </div>
      </div>
      <div className="h-[64px]" />

      <section className="card-dark">
        <div className="min-h-[140px] whitespace-pre-wrap">
          {answer || "Escribí tu consulta abajo…"}
        </div>
      </section>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu prompt…"
          className="input-dark flex-1"
        />
        <button onClick={ask} className="btn btn-cta">Enviar</button>
      </div>
    </main>
  );
}
