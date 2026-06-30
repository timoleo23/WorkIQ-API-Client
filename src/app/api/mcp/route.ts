import { NextRequest, NextResponse } from "next/server";
import { WORKIQ_BASE_URL, ENDPOINTS } from "@/lib/workiq-config";

/**
 * Proxy MCP : poste un message JSON-RPC vers le serveur Work IQ MCP.
 * Body attendu : { method: "tools/list" | "tools/call" | ..., params?: ..., id? }
 *
 * MCP "Streamable HTTP" transport : POST JSON-RPC, réponse soit JSON (single) soit
 * text/event-stream (multi). On absorbe les deux.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json(
      { error: "Missing Authorization header. Sign in first." },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!payload.method) {
    return NextResponse.json({ error: "method is required" }, { status: 400 });
  }

  const url = `${WORKIQ_BASE_URL}${ENDPOINTS.mcp.server}`;
  const rpc = {
    jsonrpc: "2.0",
    id: typeof payload.id === "string" || typeof payload.id === "number" ? payload.id : crypto.randomUUID(),
    method: payload.method,
    params: payload.params ?? {}
  };

  const started = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: auth,
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-06-18"
      },
      body: JSON.stringify(rpc)
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upstream fetch failed", detail: String(err) },
      { status: 502 }
    );
  }
  const elapsedMs = Date.now() - started;
  const contentType = upstream.headers.get("content-type") ?? "";
  const text = await upstream.text();

  // SSE -> parser pour récupérer le dernier message JSON-RPC
  let parsedBody: unknown = text;
  if (contentType.includes("text/event-stream")) {
    parsedBody = parseSse(text);
  } else if (contentType.includes("application/json") && text.length > 0) {
    try {
      parsedBody = JSON.parse(text);
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
      contentType,
      request: rpc,
      body: parsedBody
    },
    { status: 200 }
  );
}

function parseSse(text: string): unknown {
  // Concatène les data: ... d'un event, puis renvoie un tableau d'événements parsés
  const events: unknown[] = [];
  for (const block of text.split(/\r?\n\r?\n/)) {
    const dataLines = block
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trimStart());
    if (dataLines.length === 0) continue;
    const joined = dataLines.join("\n");
    try {
      events.push(JSON.parse(joined));
    } catch {
      events.push(joined);
    }
  }
  return events.length === 1 ? events[0] : events;
}
