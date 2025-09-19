export async function POST(req: Request) {
  const body = await req.text();
  return new Response(`LUCAI (mock): Recibí -> "${body}"`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
