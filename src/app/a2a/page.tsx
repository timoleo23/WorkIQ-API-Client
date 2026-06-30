"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { AuthGate } from "@/components/AuthGate";
import { JsonViewer } from "@/components/JsonViewer";
import { MarkdownLite } from "@/components/MarkdownLite";
import { ENDPOINTS } from "@/lib/workiq-config";
import { useWorkIqClient, type ProxyResponse } from "@/lib/workiq-client";

interface A2ATurn {
  user: string;
  assistant?: string;
  envelopeOut: unknown;
  envelopeIn?: unknown;
  status?: number;
  elapsedMs?: number;
  error?: string;
  taskId?: string;
}

export default function A2APage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-800">
          <span className="h-1.5 w-1.5 rounded-full bg-a2a" />
          A2A — Agent-to-Agent
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Work IQ A2A — découverte d&apos;agent &amp; conversation JSON-RPC
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Le protocole{" "}
          <a
            href="https://a2a-protocol.org/latest/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Agent-to-Agent
          </a>{" "}
          permet à un agent de déléguer une tâche à Work IQ et de récupérer le résultat sous forme
          d&apos;artefacts structurés. Le démonstrateur affiche l&apos;Agent Card découvert, puis
          une fenêtre de chat où chaque tour expose l&apos;enveloppe JSON-RPC complète.
        </p>
      </header>

      <AuthGate>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <A2AChat />
          <AgentCardPanel />
        </div>
      </AuthGate>
    </div>
  );
}

function AgentCardPanel() {
  const client = useWorkIqClient();
  const [resp, setResp] = useState<ProxyResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function discover() {
    setBusy(true);
    setError(null);
    try {
      const r = await client.call({
        method: "GET",
        path: ENDPOINTS.a2a.agentCard,
        headers: { "A2A-Version": "1.0" }
      });
      setResp(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const card = resp?.body as Record<string, unknown> | undefined;

  return (
    <aside className="rounded-xl border border-violet-200 bg-white">
      <header className="flex items-center justify-between rounded-t-xl bg-violet-50 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-violet-900">Agent Card</h3>
          <code className="text-[10px] font-mono text-violet-700">
            GET /a2a/.well-known/agent-card.json
          </code>
        </div>
        <button
          onClick={() => void discover()}
          disabled={busy}
          className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? "…" : "Discover"}
        </button>
      </header>
      <div className="space-y-3 p-4">
        {!resp && !error && (
          <p className="rounded border-2 border-dashed border-slate-200 p-4 text-xs text-slate-500">
            Cliquez sur <strong>Discover</strong> pour récupérer la carte de l&apos;agent Work IQ.
          </p>
        )}
        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
            {error}
          </div>
        )}
        {card && (
          <>
            <div className="space-y-1">
              <div className="text-base font-semibold text-slate-900">
                {String(card.name ?? "Unknown agent")}
              </div>
              <div className="text-xs text-slate-600">{String(card.description ?? "")}</div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {Boolean(card.version) && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                    v{String(card.version)}
                  </span>
                )}
                {Boolean(card.provider) && typeof card.provider === "object" && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">
                    {String((card.provider as Record<string, unknown>).organization ?? "")}
                  </span>
                )}
              </div>
            </div>

            {Array.isArray(card.supportedInterfaces) && card.supportedInterfaces.length > 0 && (
              <div>
                <div className="mb-1 text-[10px] uppercase font-semibold text-slate-500">
                  Interfaces
                </div>
                <ul className="space-y-1 text-xs">
                  {(card.supportedInterfaces as Array<Record<string, unknown>>).map((i, idx) => (
                    <li key={idx} className="rounded bg-slate-50 p-2">
                      <div className="font-mono text-[11px] break-all">{String(i.url ?? "")}</div>
                      <div className="text-[10px] text-slate-500">
                        {String(i.protocolBinding ?? "")} ·{" "}
                        protocolVersion {String(i.protocolVersion ?? "")}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {card.capabilities && (
              <div>
                <div className="mb-1 text-[10px] uppercase font-semibold text-slate-500">
                  Capabilities
                </div>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {Object.entries(card.capabilities as Record<string, unknown>).map(([k, v]) => (
                    <span
                      key={k}
                      className={`rounded px-1.5 py-0.5 font-mono ${
                        v === true
                          ? "bg-emerald-100 text-emerald-800"
                          : v === false
                          ? "bg-slate-100 text-slate-500"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {k}: {Array.isArray(v) ? `[${v.length}]` : String(v)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer text-slate-600">JSON complet</summary>
              <div className="mt-2">
                <JsonViewer value={card} label="agent-card.json" maxHeight={320} />
              </div>
            </details>
          </>
        )}
      </div>
    </aside>
  );
}

function A2AChat() {
  const client = useWorkIqClient();
  const [contextId, setContextId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [timeZone, setTimeZone] = useState<string>(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Paris"
  );
  const [turns, setTurns] = useState<A2ATurn[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setDraft("");

    const envelope = {
      jsonrpc: "2.0",
      id: uuid(),
      method: "SendMessage",
      params: {
        message: {
          role: "ROLE_USER",
          messageId: uuid(),
          ...(contextId ? { contextId } : {}),
          parts: [{ text }],
          metadata: {
            Location: {
              timeZone,
              timeZoneOffset: -new Date().getTimezoneOffset()
            }
          }
        }
      }
    } as const;

    const turn: A2ATurn = { user: text, envelopeOut: envelope };
    setTurns((t) => [...t, turn]);

    try {
      const res = await client.call({
        method: "POST",
        path: ENDPOINTS.a2a.root,
        headers: {
          "A2A-Version": "1.0",
          "Content-Type": "application/json"
        },
        body: envelope
      });

      const body = asObject(res.body);
      const result = body?.result as Record<string, unknown> | undefined;
      const task = (result?.task ?? result) as Record<string, unknown> | undefined;
      const taskId = task?.id as string | undefined;
      const ctxId = task?.contextId as string | undefined;
      if (ctxId) setContextId(ctxId);

      const assistant = extractA2AText(task);

      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = {
          ...turn,
          envelopeIn: res.body,
          assistant: assistant ?? "_(pas de texte — voir l'enveloppe JSON-RPC ci-dessous)_",
          status: res.status,
          elapsedMs: res.elapsedMs,
          taskId
        };
        return next;
      });
    } catch (e) {
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = { ...turn, error: String(e) };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setContextId(null);
    setTurns([]);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between rounded-t-xl bg-violet-50/60 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-violet-900">JSON-RPC chat</h3>
          <p className="text-xs text-violet-800">
            <code className="font-mono">POST /a2a/</code> · method{" "}
            <code className="font-mono">SendMessage</code> · header{" "}
            <code className="font-mono">A2A-Version: 1.0</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-600">
            timeZone&nbsp;
            <input
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="ml-1 rounded border border-slate-200 px-2 py-0.5 font-mono text-xs"
            />
          </label>
          <button
            onClick={reset}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            ↻ Reset
          </button>
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-700">contextId :</span>{" "}
          <code className="font-mono">{contextId ?? "— (premier tour créera un nouveau contexte)"}</code>
        </div>

        <div className="space-y-4">
          {turns.length === 0 && (
            <div className="rounded-md border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              Envoyez votre premier message pour démarrer la conversation A2A.
            </div>
          )}
          {turns.map((t, i) => (
            <A2ATurnView key={i} turn={t} />
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex gap-2 border-t border-slate-200 pt-4"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Posez une question à l'agent Work IQ…"
            disabled={busy}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {busy ? "…" : "SendMessage"}
          </button>
        </form>
      </div>
    </section>
  );
}

function A2ATurnView({ turn }: { turn: A2ATurn }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-2 text-sm text-white">
          {turn.user}
        </div>
      </div>
      {turn.error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
          Erreur : {turn.error}
        </div>
      ) : turn.assistant ? (
        <div className="space-y-2">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-slate-900 ring-1 ring-slate-200">
            <MarkdownLite text={turn.assistant} />
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
            {turn.taskId && (
              <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono">
                taskId={turn.taskId.slice(0, 8)}…
              </span>
            )}
            {turn.status && (
              <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono">
                status={turn.status}
              </span>
            )}
            {turn.elapsedMs !== undefined && (
              <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono">
                {turn.elapsedMs}ms
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-sm text-slate-400">
          …
        </div>
      )}
      <details className="text-[10px] text-slate-500">
        <summary className="cursor-pointer">↳ Voir les enveloppes JSON-RPC</summary>
        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          <JsonViewer value={turn.envelopeOut} label="→ Request" maxHeight={260} />
          {turn.envelopeIn !== undefined && (
            <JsonViewer value={turn.envelopeIn} label="← Response" maxHeight={260} />
          )}
        </div>
      </details>
    </div>
  );
}

function extractA2AText(task: Record<string, unknown> | undefined): string | undefined {
  if (!task) return undefined;
  const artifacts = task.artifacts as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(artifacts)) {
    for (const a of artifacts) {
      const parts = a.parts as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(parts)) {
        const t = parts.find((p) => typeof p.text === "string");
        if (t && typeof t.text === "string") return t.text;
      }
    }
  }
  const status = task.status as Record<string, unknown> | undefined;
  if (status && typeof status.message === "object" && status.message) {
    const m = status.message as Record<string, unknown>;
    const parts = m.parts as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(parts)) {
      const t = parts.find((p) => typeof p.text === "string");
      if (t && typeof t.text === "string") return t.text;
    }
  }
  return undefined;
}

/**
 * Normalise un body en objet : si le proxy ne l'a pas parsé (content-type non
 * standard), on tente un JSON.parse ici pour pouvoir naviguer dans la réponse.
 */
function asObject(body: unknown): Record<string, unknown> | undefined {
  if (!body) return undefined;
  if (typeof body === "object") return body as Record<string, unknown>;
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(body);
        return typeof parsed === "object" && parsed
          ? (parsed as Record<string, unknown>)
          : undefined;
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
