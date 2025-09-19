"use client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("lu_isAuthed", "1"); // dummy auth
    r.push("/chat");
  };

  return (
    <main className="lu:flex lu:min-h-screen lu:items-center lu:justify-center lu:p-6">
      <div className="lu:w-full lu:max-w-md lu:bg-white lu:border lu:border-slate-200 lu:rounded-2xl lu:shadow">
        <div className="lu:p-6 lu:space-y-4">
          <h1 className="lu:text-2xl lu:font-medium">Unlocking biology’s true power with AI</h1>
          <p className="lu:text-slate-600">Accedé al MVP para probar el chat.</p>

          <form onSubmit={onSubmit} className="lu:space-y-3">
            <input
              placeholder="Email (dummy)"
              className="lu:w-full lu:border lu:border-slate-200 lu:rounded-xl lu:px-3 lu:py-2 focus:lu:outline-none focus:lu:ring-2 focus:lu:ring-emerald-500"
            />
            <button
              type="submit"
              className="lu:w-full lu:rounded-full lu:px-4 lu:py-2 lu:text-white lu:bg-emerald-600 hover:lu:bg-emerald-700 lu:transition"
            >
              Get Started
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
