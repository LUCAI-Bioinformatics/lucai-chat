"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hi! How may i assist you?" },
  ]);

  // autosize textarea + altura del dock
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const resize = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(220, ta.scrollHeight);
    ta.style.height = next + "px";
    document.documentElement.style.setProperty("--dock-h", next + 40 + "px");
  };
  useEffect(resize, []);
  useEffect(resize, [input]);

  // autoscroll del board
  const boardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    boardRef.current?.scrollTo({
      top: boardRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs]);

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

  const onSubmitDock = (e: React.FormEvent) => {
    e.preventDefault();
    ask();
  };

  return (
    <main id="lucai-app" className="min-h-screen pb-[var(--dock-h,120px)]">
      {/* HEADER */}
      <header className="header-dark">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <Image
            src="/brand/logo.png"
            alt="LUCAI"
            width={180}
            height={40}
            className="brand-logo"
            priority
          />
          <Image
            src="/brand/pelota-luca.png"
            alt=""
            width={120}
            height={120}
            className="brand-sphere"
            priority
          />
        </div>
      </header>
      <div className="h-[68px]" />

      {/* THREAD */}
      <section className="max-w-6xl mx-auto p-6 space-y-6">
        <div ref={boardRef} className="card-dark chat-board">
          <div className="chat-thread" aria-live="polite">
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
      </section>

      {/* INPUT DOCK */}
      <div className="input-dock">
        <form
          onSubmit={onSubmitDock}
          className="max-w-6xl mx-auto px-4 pb-3 relative"
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={resize}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            rows={1}
            placeholder="Write your message..."
            className="pill-textarea dock-textarea resize-none w-full"
            autoFocus
          />
          <button
            type="submit"
            className="btn-outline send-btn"
            disabled={!input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
