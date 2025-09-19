"use client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("lu_isAuthed", "1");
    r.push("/chat");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card-dark w-full max-w-md">
        <div className="space-y-4">
          <h1 className="text-2xl font-medium">Unlocking biology’s true power with AI</h1>
          <p className="text-[color:var(--lu-subtle)]">Accedé al MVP para probar el chat.</p>
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="input-dark" placeholder="Email (dummy)" />
            <button type="submit" className="btn btn-cta">Get Started</button>
          </form>
        </div>
      </div>
    </main>
  );
}
