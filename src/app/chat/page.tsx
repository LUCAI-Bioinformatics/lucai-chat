"use client";

import Image from "next/image";
import { useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Escribí tu consulta abajo…" },
  ]);

  const ask = async () => {
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    try {
      const res = await fetch("/api/chat", { method: "POST", body: q });
      const text = await res.text();
      setMsgs((m) => [...m, { role: "bot", text }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Error de red." }]);
    }
  };

  return (
    <main className="relative min-h-screen">
      {/* fondo sutil (si ya lo usás en login) */}
      <div className="hex-bg" aria-hidden />

      {/* HEADER */}
      <header className="header-dark">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <Image src="/brand/logo.png" alt="LUCAI" width={120} height={28} />
          {/* pelota arriba a la derecha */}
          <Image
            src="/brand/pelota-luca.png"
            alt=""
            width={90}
            height={90}
            className="drop-shadow-[0_12px_30px_rgba(255,105,0,.35)]"
            priority
          />
        </div>
      </header>
      <div className="h-[68px]" />

      {/* CONTENIDO */}
      <section className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="card-dark">
          <div className="chat-thread">
            {msgs.map((m, i) => (
              <p
                key={i}
                className={`bubble ${m.role === "user" ? "bubble-user" : "bubble-bot"}`}
              >
                {m.text}
              </p>
            ))}
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="input-bar">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              placeholder="Escribí tu prompt…"
              className="pill-input flex-1"
            />
            <button onClick={ask} className="btn-cta">Enviar</button>
          </div>
        </div>
      </section>
    </main>
  );
}
