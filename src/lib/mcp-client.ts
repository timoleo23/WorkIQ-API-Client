"use client";

import { useAuth } from "./auth-context";

export interface McpProxyResponse {
  status: number;
  statusText: string;
  elapsedMs: number;
  url: string;
  contentType: string;
  request: { jsonrpc: "2.0"; id: string | number; method: string; params: unknown };
  body: unknown;
}

export function useMcpClient() {
  const { getToken } = useAuth();

  async function call(method: string, params?: unknown): Promise<McpProxyResponse> {
    const token = await getToken();
    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ method, params: params ?? {} })
    });
    if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const err = await res.json();
      throw new Error(err.error || `MCP proxy error ${res.status}`);
    }
    return (await res.json()) as McpProxyResponse;
  }

  return { call };
}
