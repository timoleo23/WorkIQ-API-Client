import { NextRequest, NextResponse } from "next/server";
import { WORKIQ_BASE_URL } from "@/lib/workiq-config";

/**
 * Proxy générique pour relayer les appels vers `workiq.svc.cloud.microsoft`.
 * Le client envoie le token Entra dans `Authorization`. Le serveur le transmet
 * tel quel pour contourner CORS depuis le navigateur.
 *
 * URL : POST /api/proxy
 * Body : { method, path, headers?, body? }
 */
export async function POST(req: NextRequest) {
  let payload: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
    stream?: boolean;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { method, path, headers = {}, body, stream } = payload;
  if (!method || !path) {
    return NextResponse.json({ error: "method and path are required" }, { status: 400 });
  }
  if (!path.startsWith("/")) {
    return NextResponse.json({ error: "path must start with /" }, { status: 400 });
  }

  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json(
      { error: "Missing Authorization header. Sign in first." },
      { status: 401 }
    );
  }

  const url = `${WORKIQ_BASE_URL}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      Authorization: auth,
      Accept: "application/json",
      ...headers
    }
  };
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    (init.headers as Record<string, string>)["Content-Type"] ||= "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const started = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (err) {
    return NextResponse.json(
      { error: "Upstream fetch failed", detail: String(err) },
      { status: 502 }
    );
  }
  const elapsedMs = Date.now() - started;

  // For SSE streaming, pipe through.
  const contentType = upstream.headers.get("content-type") ?? "";
  if (stream && contentType.includes("text/event-stream") && upstream.body) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Workiq-Upstream-Status": String(upstream.status),
        "X-Workiq-Elapsed-Ms": String(elapsedMs)
      }
    });
  }

  const text = await upstream.text();
  let parsed: unknown = text;
  if (contentType.includes("application/json") && text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep raw */
    }
  }

  return NextResponse.json(
    {
      status: upstream.status,
      statusText: upstream.statusText,
      elapsedMs,
      url,
      headers: Object.fromEntries(upstream.headers.entries()),
      body: parsed
    },
    {
      status: 200,
      headers: { "X-Workiq-Upstream-Status": String(upstream.status) }
    }
  );
}
