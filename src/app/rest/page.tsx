"use client";

import { useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { JsonViewer } from "@/components/JsonViewer";
import { MarkdownLite } from "@/components/MarkdownLite";
import { MethodBadge } from "@/components/MethodBadge";
import { REST_METHODS } from "@/lib/rest-methods";
import { ENDPOINTS } from "@/lib/workiq-config";
import { useWorkIqClient, type ProxyResponse } from "@/lib/workiq-client";

interface Turn {
  user: string;
  assistant?: string;
  raw?: ProxyResponse;
  startedAt: number;
  elapsedMs?: number;
  error?: string;
}

export default function RestPage() {
  const [selectedId, setSelectedId] = useState<string>("create-conversation");
  const selected = useMemo(() => REST_METHODS.find((m) => m.id === selectedId)!, [selectedId]);

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-rest" />
          REST API
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Work IQ REST — méthodes & try-it</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          API conversationnelle multi-tour avec Microsoft 365 Copilot. Idéale pour les applications
          ou backends qui appellent Work IQ programmatiquement. Sélectionnez une méthode à gauche
          pour voir sa spec, puis essayez le panneau « Try-it » à droite pour créer une conversation
          réelle et discuter.
        </p>
      </header>

      <AuthGate>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Liste des méthodes */}
          <aside className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Méthodes ({REST_METHODS.length})</h2>
            </div>
            <ul>
              {REST_METHODS.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setSelectedId(m.id)}
                    className={`flex w-full items-start gap-2 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      selectedId === m.id ? "bg-amber-50" : ""
                    }`}
                  >
                    <MethodBadge method={m.method} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-mono text-slate-700">{m.path}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{m.title}</div>
                      {m.stability === "beta" && (
                        <span className="mt-1 inline-block rounded bg-rose-100 px-1 text-[9px] font-semibold uppercase text-rose-700">
                          beta
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Détails + try-it */}
          <div className="space-y-6">
            <MethodDetails method={selected} />
            <RestTryIt />
          </div>
        </div>
      </AuthGate>
    </div>
  );
}

function MethodDetails({ method }: { method: (typeof REST_METHODS)[number] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <MethodBadge method={method.method} />
        <code className="text-sm font-mono text-slate-800">{method.path}</code>
        {method.stability === "beta" && (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-700">
            beta
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{method.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{method.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {method.permissions.map((p) => (
          <span
            key={p}
            className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700 ring-1 ring-slate-200"
          >
            {p}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {method.requestBody && <JsonViewer value={method.requestBody} label="Request body" maxHeight={260} />}
        {method.responseBody && <JsonViewer value={method.responseBody} label="Response (200/201)" maxHeight={260} />}
      </div>
    </section>
  );
}

function RestTryIt() {
  const client = useWorkIqClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [createResp, setCreateResp] = useState<ProxyResponse | null>(null);
  const [timeZone, setTimeZone] = useState<string>(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Europe/Paris"
  );
  const [webSearch, setWebSearch] = useState(true);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createConversation() {
    setBusy(true);
    setError(null);
    try {
      const res = await client.call({
        method: "POST",
        path: ENDPOINTS.rest.createConversation,
        body: {}
      });
      setCreateResp(res);
      const body = res.body as { id?: string } | string;
      const id = typeof body === "object" && body && "id" in body ? body.id : undefined;
      if (id) {
        setConversationId(id);
        setTurns([]);
      } else {
        setError(`No conversation id returned (status ${res.status}).`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || !conversationId) return;
    setBusy(true);
    setError(null);
    setDraft("");

    const turn: Turn = { user: text, startedAt: Date.now() };
    setTurns((t) => [...t, turn]);

    const body: Record<string, unknown> = {
      message: { text },
      locationHint: { timeZone }
    };
    if (!webSearch) body.contextualResources = { webSearch: false };

    try {
      const res = await client.call({
        method: "POST",
        path: ENDPOINTS.rest.chat(conversationId),
        body
      });
      const assistant = extractAssistantText(res.body);
      setTurns((t) => {
        const next = [...t];
        next[next.length - 1] = {
          ...turn,
          assistant: assistant ?? "_(réponse sans texte — voir le JSON brut)_",
          raw: res,
          elapsedMs: res.elapsedMs
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

  return (
    <section className="rounded-xl border border-amber-200 bg-white">
      <header className="flex items-center justify-between rounded-t-xl bg-amber-50 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Try-it — REST chat</h3>
          <p className="text-xs text-amber-800">
            Crée une conversation puis envoie des messages synchrones via{" "}
            <code className="font-mono">POST /rest/conversations/{"{id}"}/chat</code>.
          </p>
        </div>
        <button
          onClick={() => void createConversation()}
          disabled={busy}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {conversationId ? "↻ Nouvelle conversation" : "+ Créer une conversation"}
        </button>
      </header>

      <div className="space-y-4 p-6">
        {/* Conversation header */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] uppercase font-semibold text-slate-500">conversationId</div>
            <div className="mt-1 break-all font-mono text-xs">
              {conversationId ?? "— (créez une conversation)"}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <label className="text-[10px] uppercase font-semibold text-slate-500">timeZone (IANA)</label>
            <input
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
            />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={webSearch}
              onChange={(e) => setWebSearch(e.target.checked)}
            />
            Web search grounding{" "}
            <span className="text-slate-400">(décocher = single-turn off)</span>
          </label>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        {createResp && (
          <details className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-slate-700">
              Réponse de POST /rest/conversations — status {createResp.status} (
              {createResp.elapsedMs} ms)
            </summary>
            <div className="mt-2">
              <JsonViewer value={createResp.body} label="Body" maxHeight={220} />
            </div>
          </details>
        )}

        {/* Conversation thread */}
        <div className="space-y-3">
          {turns.length === 0 && (
            <div className="rounded-md border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              Aucun tour pour l&apos;instant. Posez une question pour commencer.
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 text-sm text-white">
                  {t.user}
                </div>
              </div>
              {t.error ? (
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-rose-50 px-4 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
                  Erreur : {t.error}
                </div>
              ) : t.assistant ? (
                <div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-slate-900 ring-1 ring-slate-200">
                    <MarkdownLite text={t.assistant} />
                  </div>
                  {t.raw && (
                    <details className="mt-1 text-[10px] text-slate-500">
                      <summary className="cursor-pointer">
                        ↳ JSON brut (status {t.raw.status}, {t.elapsedMs} ms)
                      </summary>
                      <div className="mt-1">
                        <JsonViewer value={t.raw.body} label="Body" maxHeight={300} />
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-sm text-slate-400">
                  …
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="flex gap-2 border-t border-slate-200 pt-4"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              conversationId
                ? "Posez votre question (ex: Quelles réunions ai-je demain ?)"
                : "Créez d'abord une conversation"
            }
            disabled={!conversationId || busy}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!conversationId || busy || !draft.trim()}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {busy ? "…" : "Envoyer"}
          </button>
        </form>
      </div>
    </section>
  );
}

/**
 * Extrait le texte de l'assistant depuis le payload Work IQ / MS Graph Copilot.
 *
 * Gère :
 *   - body déjà parsé (objet)
 *   - body string JSON (le proxy peut ne pas avoir parsé : content-type non standard)
 *   - shape MS Graph `copilotConversation` : `messages[]` contient l'écho utilisateur en
 *     premier et la/les réponse(s) ensuite (pas de champ `role`, distinguées par leur ordre
 *     et leur différence vs `displayName`).
 */
function extractAssistantText(body: unknown): string | undefined {
  let val: unknown = body;

  // Si la réponse est arrivée sous forme de string, tenter de la parser comme JSON.
  if (typeof val === "string") {
    const original: string = val;
    const trimmed = original.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        val = JSON.parse(original);
      } catch {
        return original; // JSON invalide → on retourne la string telle quelle
      }
    } else {
      return original;
    }
  }

  if (!val || typeof val !== "object") return undefined;
  const obj = val as Record<string, unknown>;

  // MS Graph copilotConversation : trouver le dernier message dont le texte n'est
  // pas l'écho de la question utilisateur (= displayName de la conversation).
  const messages = obj.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    const userEcho =
      typeof obj.displayName === "string" ? obj.displayName.trim() : "";
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i] as Record<string, unknown> | undefined;
      if (!m) continue;
      const text = pickText(m);
      if (text && text.trim() && text.trim() !== userEcho) return text;
    }
    // Fallback : dernier message quel qu'il soit
    const last = messages[messages.length - 1] as Record<string, unknown> | undefined;
    const fallback = last ? pickText(last) : undefined;
    if (fallback) return fallback;
  }

  // Autres shapes : { text }, { reply: { text } }
  if (typeof obj.text === "string") return obj.text;
  if (obj.reply && typeof obj.reply === "object") {
    const r = obj.reply as Record<string, unknown>;
    if (typeof r.text === "string") return r.text;
  }
  return undefined;
}

function pickText(m: Record<string, unknown>): string | undefined {
  if (typeof m.text === "string") return m.text;
  if (typeof m.content === "string") return m.content;
  const parts = m.parts as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(parts)) {
    const t = parts.find((p) => typeof p.text === "string");
    if (t && typeof t.text === "string") return t.text;
  }
  return undefined;
}
