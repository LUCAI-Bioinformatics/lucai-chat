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
      <header className="lu:sticky lu:top-0 lu:bg-white/80 lu:backdrop-blur lu:z-10">
        <h1 className="lu:text-xl lu:font-medium lu:py-3">LUCAI — Chat (MVP)</h1>
      </header>

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
