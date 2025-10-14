const backendBase =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080/api";

export async function POST(req: Request) {
  let question: string | undefined;
  try {
    const payload = await req.json();
    question = payload?.question;
  } catch {
    // fallback to raw text
    question = (await req.text())?.trim();
  }

  if (!question) {
    return Response.json({ error: "question-required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendBase.replace(/\/$/, "")}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const body = await response.json().catch(() => ({}));
    return Response.json(body, { status: response.status });
  } catch (error) {
    console.error("[frontend/api/chat] backend error", error);
    return Response.json({ error: "backend-unreachable" }, { status: 502 });
  }
}
