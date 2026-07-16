import { createFileRoute } from "@tanstack/react-router";

const BACKEND = process.env.NOTIFICATION_BACKEND_URL ?? "http://43.204.218.209:3000";
const CLIENT_ID = process.env.NOTIFICATION_CLIENT_ID ?? "a3ea1cda-c735-4798-8219-54bbb07795a9";

async function forward({ request, params }: { request: Request; params: { _splat?: string } }) {
  const splat = params._splat ?? "";
  const incoming = new URL(request.url);
  const target = new URL(splat, BACKEND.endsWith("/") ? BACKEND : BACKEND + "/");
  // Preserve query string
  incoming.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  const headers = new Headers();
  request.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (["host", "connection", "content-length", "cookie", "x-client-id"].includes(lk)) return;
    headers.set(k, v);
  });
  headers.set("x-client-id", CLIENT_ID);

  const method = request.method.toUpperCase();
  const init: RequestInit = { method, headers };
  if (!["GET", "HEAD"].includes(method)) {
    // Stream body through for multipart/JSON alike
    init.body = await request.arrayBuffer();
  }

  try {
    const res = await fetch(target.toString(), init);
    const resHeaders = new Headers(res.headers);
    resHeaders.delete("content-encoding");
    resHeaders.delete("transfer-encoding");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: resHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Upstream unreachable", detail: String(err) }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}

export const Route = createFileRoute("/api/proxy/$")({
  server: {
    handlers: {
      GET: forward,
      POST: forward,
      PATCH: forward,
      PUT: forward,
      DELETE: forward,
      OPTIONS: async () => new Response(null, { status: 204 }),
    },
  },
});