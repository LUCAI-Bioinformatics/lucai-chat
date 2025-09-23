"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [show, setShow]   = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !pass) return;
    // fake auth token en localStorage
    localStorage.setItem("lu_isAuthed", "1");
    // redirección a la Homepage
    r.push("/");
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-16">
      <div className="hex-bg" aria-hidden />

      <div className="panel-lg w-full">
        <div className="flex items-center justify-center mb-8">
          <Image src="/brand/logo.png" alt="LUCAI" width={160} height={36} priority />
        </div>

        <h2 className="kicker">Ready to unlock your true potential?</h2>

        <form
          onSubmit={onSubmit}
          className="mx-auto max-w-3xl grid gap-6"
          style={{ "--send-w": "96px" } as React.CSSProperties}
        >
          <input
            className="pill-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <div className="relative">
            <input
              className="pill-input w-full pr-14"
              placeholder="Password"
              type={show ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="eye-btn eye-ghost"
            >
              {show ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.03-2.89 2.99-5.23 5.5-6.74"/>
                  <path d="M1 1l22 22"/>
                  <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"/>
                  <path d="M10.73 5.08A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.66 11.66 0 0 1-2.62 3.95"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <button type="submit" className="btn-outline btn-enter">Enter</button>
        </form>
      </div>
    </main>
  );
}
