"use client";
import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string>("");

  const ask = async () => {
    if (!input.trim()) return;
    setAnswer("…thinking");
    const res = await fetch("/api/chat", { method: "POST", body: input });
    const text = await res.text();
    setAnswer(text);
  };

  return (
    <main className="lu:max-w-3xl lu:mx-auto lu:p-6 lu:space-y-6">

      <div className="she-header she-blur-yes lu:w-full lu:bg-white/70 lu:backdrop-blur">
        <div className="lu:max-w-6xl lu:mx-auto lu:flex lu:items-center lu:justify-between lu:px-4 lu:py-3">
          <img src="/brand/logo.png" alt="LUCAI" width={160} height={36} />
        </div>
      </div>
      <div className="lu:h-[64px]" /> {/* spacer por header fijo */}

      <section className="lu:border lu:border-slate-200 lu:bg-white lu:rounded-2xl lu:shadow lu:p-5">
        <div className="lu:min-h-[120px] lu:text-slate-700">
          {answer || "Escribí tu consulta abajo…"}
        </div>
      </section>

      <div className="lu:flex lu:gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu prompt…"
          className="lu:flex-1 lu:border lu:border-slate-200 lu:rounded-xl lu:px-3 lu:py-2 focus:lu:outline-none focus:lu:ring-2 focus:lu:ring-emerald-500"
        />
        <button
          onClick={ask}
          className="lu:rounded-full lu:px-4 lu:py-2 lu:text-white lu:bg-emerald-600 hover:lu:bg-emerald-700 lu:transition"
        >
          Enviar
        </button>
      </div>
    </main>
  );
}
