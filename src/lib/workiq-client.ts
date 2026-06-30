"use client";

import { useAuth } from "./auth-context";

/**
 * Helper client : envoie une requête authentifiée vers l'API Work IQ
 * en passant par le proxy serveur Next.js (/api/proxy).
 */
export interface ProxyResponse<T = unknown> {
  status: number;
  statusText: string;
  elapsedMs: number;
  url: string;
  headers: Record<string, string>;
  body: T;
}

export interface ProxyRequest {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export function useWorkIqClient() {
  const { getToken } = useAuth();

  async function call<T = unknown>(req: ProxyRequest): Promise<ProxyResponse<T>> {
    const token = await getToken();
    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req)
    });
    if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const err = await res.json();
      throw new Error(err.error || `Proxy error ${res.status}`);
    }
    return (await res.json()) as ProxyResponse<T>;
  }

  return { call };
}
