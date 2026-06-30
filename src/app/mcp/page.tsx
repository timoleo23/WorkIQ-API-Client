"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { JsonViewer } from "@/components/JsonViewer";
import {
  MCP_CATEGORY_META,
  MCP_TOOLS,
  type McpToolSpec,
  type McpToolCategory,
  type McpToolParameter
} from "@/lib/mcp-tools";
import { useMcpClient, type McpProxyResponse } from "@/lib/mcp-client";

interface DiscoveredTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export default function McpPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-mcp" />
          Remote MCP
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Work IQ MCP — outils &amp; capacités découvertes
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Serveur MCP distant exposant Microsoft 365 comme un ensemble d&apos;outils génériques.
          Conçu pour les LLM (IDE, CLI, copilots). Le démonstrateur exécute{" "}
          <code className="font-mono">tools/list</code> pour découvrir dynamiquement les
          capacités, puis affiche un panneau d&apos;invocation par outil.
        </p>
      </header>

      <AuthGate>
        <McpExplorer />
      </AuthGate>
    </div>
  );
}

function McpExplorer() {
  const mcp = useMcpClient();
  const [selectedName, setSelectedName] = useState<string>("ask");
  const [discovered, setDiscovered] = useState<DiscoveredTool[] | null>(null);
  const [discoverResp, setDiscoverResp] = useState<McpProxyResponse | null>(null);
  const [discoverErr, setDiscoverErr] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);

  async function discover() {
    setDiscovering(true);
    setDiscoverErr(null);
    try {
      const r = await mcp.call("tools/list");
      setDiscoverResp(r);
      const body = r.body as Record<string, unknown> | undefined;
      const result = (body?.result ?? body) as Record<string, unknown> | undefined;
      const tools = (result?.tools as DiscoveredTool[] | undefined) ?? [];
      setDiscovered(tools);
    } catch (e) {
      setDiscoverErr(String(e));
    } finally {
      setDiscovering(false);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<McpToolCategory, McpToolSpec[]> = { entity: [], copilot: [], schema: [] };
    for (const t of MCP_TOOLS) map[t.category].push(t);
    return map;
  }, []);

  const selected = MCP_TOOLS.find((t) => t.name === selectedName) ?? MCP_TOOLS[0];
  const discoveredFor = discovered?.find((d) => d.name === selectedName);

  return (
    <div className="space-y-6">
      {/* Discovery banner */}
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-emerald-900">Découverte des capacités</h2>
            <p className="text-xs text-emerald-800">
              POST <code className="font-mono">https://workiq.svc.cloud.microsoft/mcp</code> ·
              method <code className="font-mono">tools/list</code>
            </p>
          </div>
          <button
            onClick={() => void discover()}
            disabled={discovering}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {discovering ? "Discovery…" : discovered ? "↻ Re-discover" : "Discover tools"}
          </button>
        </div>
        {discoverErr && (
          <div className="mt-3 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
            {discoverErr}
          </div>
        )}
        {discovered && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-900">
              {discovered.length} outils découverts :
            </span>
            {discovered.map((t) => (
              <code
                key={t.name}
                className="rounded bg-white px-1.5 py-0.5 font-mono text-emerald-800 ring-1 ring-emerald-200"
              >
                {t.name}
              </code>
            ))}
            {discoverResp && (
              <span className="ml-auto text-[10px] text-emerald-700">
                {discoverResp.status} · {discoverResp.elapsedMs} ms
              </span>
            )}
          </div>
        )}
      </section>

      {/* Tool grid */}
      <section className="space-y-6">
        {(Object.keys(grouped) as McpToolCategory[]).map((cat) => {
          const meta = MCP_CATEGORY_META[cat];
          return (
            <div key={cat}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ring-1 ${meta.color}`}>
                  {meta.label}
                </h3>
                <span className="text-xs text-slate-500">{meta.description}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {grouped[cat].map((tool) => {
                  const isDiscovered = discovered?.some((d) => d.name === tool.name);
                  const isSelected = selectedName === tool.name;
                  return (
                    <button
                      key={tool.name}
                      onClick={() => setSelectedName(tool.name)}
                      className={`group rounded-lg border bg-white p-3 text-left transition hover:border-emerald-400 hover:shadow ${
                        isSelected ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-semibold text-slate-900">{tool.name}</code>
                        {discovered &&
                          (isDiscovered ? (
                            <span
                              title="Présent dans tools/list"
                              className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-bold uppercase text-emerald-700"
                            >
                              ✓ live
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                              spec
                            </span>
                          ))}
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs text-slate-600">
                        {tool.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tool.parameters
                          .filter((p) => p.required)
                          .map((p) => (
                            <span
                              key={p.name}
                              className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-mono text-slate-700"
                            >
                              {p.name}
                            </span>
                          ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Invocation panel — full width, below the capabilities grid */}
      <ToolInvocationPanel tool={selected} discovered={discoveredFor} />

      {discoverResp && (
        <details className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-slate-700">
            Réponse brute de <code className="font-mono">tools/list</code>
          </summary>
          <div className="mt-2">
            <JsonViewer value={discoverResp.body} label="tools/list response" maxHeight={400} />
          </div>
        </details>
      )}
    </div>
  );
}

function ToolInvocationPanel({
  tool,
  discovered
}: {
  tool: McpToolSpec;
  discovered: DiscoveredTool | undefined;
}) {
  const mcp = useMcpClient();
  const [argsText, setArgsText] = useState(JSON.stringify(tool.sampleArguments, null, 2));
  const [resp, setResp] = useState<McpProxyResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Discovered possible values per parameter (cached). Populated either eagerly
  // (static enums) on mount, or lazily via `discoverParam` (search_paths).
  const [discoveredValues, setDiscoveredValues] = useState<Record<string, string[]>>({});
  const [discovering, setDiscovering] = useState<Record<string, boolean>>({});
  const [discoverErr, setDiscoverErr] = useState<Record<string, string>>({});

  useEffect(() => {
    setArgsText(JSON.stringify(tool.sampleArguments, null, 2));
    setResp(null);
    setErr(null);
    // Seed initial values for any parameter that ships a curated list
    // (`discovery.values`) \u2014 used both for purely-static enums and as a
    // pre-population for search_paths-discoverable params.
    const seed: Record<string, string[]> = {};
    for (const p of tool.parameters) {
      if (p.discovery?.values?.length) {
        seed[p.name] = p.discovery.values;
      }
    }
    setDiscoveredValues(seed);
    setDiscovering({});
    setDiscoverErr({});
  }, [tool.name]);

  async function discoverParam(p: McpToolParameter) {
    const d = p.discovery;
    if (!d) return;
    if (d.source === "static") {
      setDiscoveredValues((s) => ({ ...s, [p.name]: d.values ?? [] }));
      return;
    }
    setDiscovering((s) => ({ ...s, [p.name]: true }));
    setDiscoverErr((s) => {
      const next = { ...s };
      delete next[p.name];
      return next;
    });
    try {
      const r = await mcp.call("tools/call", {
        name: "search_paths",
        arguments: { filter: d.filter ?? ".*" }
      });
      const result = extractMcpResult(r.body);
      const collected: string[] = [];
      const collectStrings = (value: unknown) => {
        if (typeof value === "string") {
          collected.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) collectStrings(item);
        } else if (value && typeof value === "object") {
          for (const v of Object.values(value)) collectStrings(v);
        }
      };
      if (result) {
        if (result.structuredContent !== undefined) collectStrings(result.structuredContent);
        if (collected.length === 0 && result.content) {
          for (const c of result.content) {
            if (c.type === "text" && typeof c.text === "string") {
              const parsed = tryParseJson(c.text);
              if (parsed !== undefined) {
                collectStrings(parsed);
              } else {
                for (const line of c.text.split(/\r?\n/)) {
                  const t = line.trim();
                  if (t) collected.push(t);
                }
              }
            }
          }
        }
      }
      // Keep path-like strings only (start with "/" or contain "/").
      let values = collected.filter((v) => v.length > 0 && (v.startsWith("/") || v.includes("/")));
      if (d.postFilter) {
        try {
          const rx = new RegExp(d.postFilter);
          values = values.filter((v) => rx.test(v));
        } catch {
          /* ignore invalid regex */
        }
      }
      values = Array.from(new Set(values)).sort();
      setDiscoveredValues((s) => ({ ...s, [p.name]: values }));
      if (values.length === 0) {
        setDiscoverErr((s) => ({ ...s, [p.name]: "Aucune valeur retournée." }));
      }
    } catch (e) {
      setDiscoverErr((s) => ({ ...s, [p.name]: String(e) }));
    } finally {
      setDiscovering((s) => ({ ...s, [p.name]: false }));
    }
  }

  function applyValueToArgs(paramName: string, value: string) {
    if (!value) return;
    let obj: Record<string, unknown> = {};
    try {
      const parsed = argsText.trim() ? JSON.parse(argsText) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      /* start fresh */
    }
    obj[paramName] = value;
    setArgsText(JSON.stringify(obj, null, 2));
  }

  async function invoke() {
    setBusy(true);
    setErr(null);
    let args: unknown;
    try {
      args = argsText.trim() ? JSON.parse(argsText) : {};
    } catch (e) {
      setBusy(false);
      setErr(`JSON invalide : ${String(e)}`);
      return;
    }
    try {
      const r = await mcp.call("tools/call", { name: tool.name, arguments: args });
      setResp(r);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-emerald-200 bg-white">
      <header className="rounded-t-xl border-b border-emerald-100 bg-emerald-50/80 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wide text-emerald-700">
            Test d&apos;invocation
          </span>
          <code className="text-sm font-bold text-emerald-900">{tool.name}</code>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ${
              MCP_CATEGORY_META[tool.category].color
            }`}
          >
            {tool.category}
          </span>
        </div>
        <p className="mt-1 text-xs text-emerald-900/90">{tool.description}</p>
      </header>

      <div className="grid gap-6 p-4 lg:grid-cols-2">
        {/* Left column — request */}
        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] uppercase font-semibold text-slate-500">Paramètres (spec)</h4>
            <ul className="mt-1 space-y-1 text-xs">
              {tool.parameters.length === 0 && (
                <li className="text-slate-500">Aucun paramètre.</li>
              )}
              {tool.parameters.map((p) => (
                <li key={p.name} className="flex flex-wrap items-center gap-2">
                  <code className="font-mono font-semibold text-slate-800">{p.name}</code>
                  <span className="text-slate-400">:</span>
                  <code className="font-mono text-slate-600">{p.type}</code>
                  {p.required && (
                    <span className="rounded bg-rose-100 px-1 text-[9px] font-bold uppercase text-rose-700">
                      req
                    </span>
                  )}
                  <span className="text-slate-600">{p.description}</span>
                  {p.discovery && (
                    <div className="basis-full mt-1 flex flex-wrap items-center gap-2 pl-4">
                      {discoveredValues[p.name]?.length ? (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            applyValueToArgs(p.name, e.target.value);
                            e.currentTarget.selectedIndex = 0;
                          }}
                          className="max-w-full rounded border border-emerald-300 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">
                            — choisir une valeur ({discoveredValues[p.name].length}) —
                          </option>
                          {discoveredValues[p.name].map((v) => (
                            <option key={v} value={v}>
                              {v.length > 80 ? `${v.slice(0, 80)}…` : v}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      {p.discovery.source === "search_paths" && (
                        <button
                          type="button"
                          onClick={() => void discoverParam(p)}
                          disabled={discovering[p.name]}
                          className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                          title={p.discovery.hint ?? "Découvrir les valeurs via search_paths"}
                        >
                          {discovering[p.name]
                            ? "…"
                            : discoveredValues[p.name]?.length
                              ? "↻ Re-découvrir"
                              : "↻ Découvrir"}
                        </button>
                      )}
                      {p.discovery.hint && (
                        <span className="text-[10px] text-slate-500">{p.discovery.hint}</span>
                      )}
                      {discoverErr[p.name] && (
                        <span className="text-[10px] text-rose-600">{discoverErr[p.name]}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {discovered?.inputSchema !== undefined && (
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-600">inputSchema (live)</summary>
              <div className="mt-1">
                <JsonViewer value={discovered.inputSchema} label="inputSchema" maxHeight={220} />
              </div>
            </details>
          )}

          <div>
            <label className="text-[10px] uppercase font-semibold text-slate-500">
              Arguments (JSON)
            </label>
            <textarea
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-md border border-slate-300 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => void invoke()}
            disabled={busy}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Invocation…" : `↗ tools/call ${tool.name}`}
          </button>

          {/* Raw technical view — sits below the call button */}
          {resp && (
            <details className="rounded-md border border-slate-200 bg-slate-50 p-2">
              <summary className="cursor-pointer text-[10px] uppercase font-bold tracking-wide text-slate-500">
                Détails techniques — JSON-RPC
              </summary>
              <div className="mt-2 space-y-2">
                <JsonViewer value={resp.request} label="→ JSON-RPC request" maxHeight={180} />
                <JsonViewer value={resp.body} label="← JSON-RPC response" maxHeight={320} />
              </div>
            </details>
          )}
        </div>

        {/* Right column — response */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase font-semibold text-slate-500">Réponse</h4>
          {err && (
            <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
              {err}
            </div>
          )}
          {!resp && !err && (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-xs text-slate-500">
              Aucune réponse pour le moment. Clique sur <em>tools/call</em> pour invoquer l&apos;outil.
            </div>
          )}
          {resp && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                  status {resp.status}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                  {resp.elapsedMs} ms
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                  {resp.contentType}
                </span>
              </div>

              {/* User-friendly view */}
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-emerald-700">
                    Vue utilisateur
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Rendu lisible des données métier
                  </span>
                </div>
                <UserView body={resp.body} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
 * UserView — render an MCP tool/call response in a friendly way.
 *
 * MCP standard envelope (tools/call):
 *   { result: {
 *       content: [{ type: "text" | "image" | "resource", ... }],
 *       structuredContent?: ...,
 *       isError?: boolean
 *     } }
 *
 * Strategy:
 *  1. If `result.isError` → show error banner with text content.
 *  2. If `result.structuredContent` exists → render it as cards/dl.
 *  3. Else iterate `result.content[]`:
 *       - text: try JSON.parse → render structured. Otherwise paragraph.
 *       - image: render <img>.
 *       - resource: render link card.
 *  4. Fallback : try to render the whole body as structured data.
 * ------------------------------------------------------------------ */

type McpContentPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType?: string }
  | { type: "resource"; resource: { uri: string; mimeType?: string; text?: string } }
  | { type: string; [k: string]: unknown };

interface McpResult {
  content?: McpContentPart[];
  structuredContent?: unknown;
  isError?: boolean;
  [k: string]: unknown;
}

function extractMcpResult(body: unknown): McpResult | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (b.result && typeof b.result === "object") return b.result as McpResult;
  // raw response without JSON-RPC envelope
  if (b.content || b.structuredContent) return b as McpResult;
  return null;
}

function tryParseJson(text: string): unknown | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (!/^[\[\{]/.test(trimmed)) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function UserView({ body }: { body: unknown }) {
  const result = extractMcpResult(body);

  if (!result) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-xs text-slate-600">
        Pas d&apos;enveloppe MCP <code>result</code> détectée. Voir l&apos;onglet technique.
      </div>
    );
  }

  if (result.isError) {
    const txt = result.content?.find((c) => c.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
        <div className="font-semibold">Erreur retournée par l&apos;outil</div>
        {txt?.text && <div className="mt-1 whitespace-pre-wrap">{txt.text}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {result.structuredContent !== undefined && (
        <SmartRender value={result.structuredContent} title="structuredContent" />
      )}
      {(result.content ?? []).map((part, i) => (
        <ContentPartView key={i} part={part} />
      ))}
      {!result.structuredContent && (!result.content || result.content.length === 0) && (
        <SmartRender value={result} title="result" />
      )}
    </div>
  );
}

function ContentPartView({ part }: { part: McpContentPart }) {
  if (part.type === "text") {
    const text = (part as { text: string }).text ?? "";
    const parsed = tryParseJson(text);
    if (parsed !== undefined) {
      return <SmartRender value={parsed} title="content[text]" />;
    }
    return <TextBubble text={text} />;
  }
  if (part.type === "image") {
    const img = part as { data: string; mimeType?: string };
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3">
        <div className="mb-1 text-[10px] uppercase font-bold tracking-wide text-slate-400">
          Image
        </div>
        <img
          src={`data:${img.mimeType ?? "image/png"};base64,${img.data}`}
          alt="MCP image content"
          className="max-h-80 max-w-full rounded"
        />
      </div>
    );
  }
  if (part.type === "resource") {
    const r = (part as { resource: { uri: string; mimeType?: string; text?: string } }).resource;
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs">
        <div className="mb-1 text-[10px] uppercase font-bold tracking-wide text-slate-400">
          Ressource
        </div>
        <a
          href={r.uri}
          target="_blank"
          rel="noreferrer"
          className="break-all font-mono text-emerald-700 underline"
        >
          {r.uri}
        </a>
        {r.mimeType && <span className="ml-2 text-slate-500">({r.mimeType})</span>}
        {r.text && (
          <div className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-slate-700">
            {r.text}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      Type de contenu non géré : <code>{part.type}</code>
    </div>
  );
}

/* ----- SmartRender: choose list vs object vs primitive ----- */

function TextBubble({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 100;
  const truncated = text.length > LIMIT;
  const shown = !truncated || expanded ? text : text.slice(0, LIMIT).trimEnd() + "…";
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Texte</span>
        {truncated && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] text-emerald-700 underline hover:text-emerald-800"
          >
            {expanded ? "Réduire" : `Afficher (${text.length} car.)`}
          </button>
        )}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{shown}</div>
    </div>
  );
}

function SmartRender({ value, title }: { value: unknown; title?: string }) {
  if (value === null || value === undefined) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-500">
        (vide)
      </div>
    );
  }
  if (Array.isArray(value)) {
    return <ItemList items={value} title={title} />;
  }
  if (typeof value === "object") {
    // Look for common wrapper keys
    const obj = value as Record<string, unknown>;
    const wrappers = ["items", "value", "results", "entities", "records", "data", "agents", "messages", "emails", "files"];
    for (const k of wrappers) {
      if (Array.isArray(obj[k])) {
        return (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-400">
              <code className="font-mono">{k}</code> · {(obj[k] as unknown[]).length} élément(s)
            </div>
            <ItemList items={obj[k] as unknown[]} />
            {Object.keys(obj).length > 1 && (
              <details className="text-[10px]">
                <summary className="cursor-pointer text-slate-500">Autres champs</summary>
                <KeyValueList obj={Object.fromEntries(Object.entries(obj).filter(([kk]) => kk !== k))} />
              </details>
            )}
          </div>
        );
      }
    }
    return <KeyValueList obj={obj} />;
  }
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
      {String(value)}
    </div>
  );
}

/* ----- ItemList: array of objects rendered as cards ----- */

function ItemList({ items, title }: { items: unknown[]; title?: string }) {
  const [showAll, setShowAll] = useState(false);
  const limit = 5;
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-500">
        Liste vide.
      </div>
    );
  }
  // primitives
  if (items.every((it) => typeof it !== "object" || it === null)) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
        {title && (
          <div className="mb-2 text-[10px] uppercase font-bold tracking-wide text-slate-400">
            {title} · {items.length} élément(s)
          </div>
        )}
        <ul className="list-disc space-y-1 pl-5 text-slate-700">
          {items.map((it, i) => (
            <li key={i}>{String(it)}</li>
          ))}
        </ul>
      </div>
    );
  }
  const visible = showAll ? items : items.slice(0, limit);
  return (
    <div>
      {title && (
        <div className="mb-2 text-[10px] uppercase font-bold tracking-wide text-slate-400">
          {title} · {items.length} élément(s)
        </div>
      )}
      <div className="space-y-2">
        {visible.map((it, i) => (
          <ItemCard key={i} item={it} index={i} />
        ))}
      </div>
      {items.length > limit && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs text-emerald-700 underline hover:text-emerald-800"
        >
          {showAll ? `↑ Masquer (${items.length - limit} de plus)` : `↓ Afficher tous les ${items.length} éléments`}
        </button>
      )}
    </div>
  );
}

/* ----- Detection of well-known fields for friendly card layout ----- */

const TITLE_KEYS = ["subject", "title", "name", "displayName", "summary", "headline", "label"];
const SUBTITLE_KEYS = ["from", "sender", "author", "creator", "owner", "by"];
const BODY_KEYS = ["bodyPreview", "preview", "snippet", "description", "body", "content", "text", "message"];
const DATE_KEYS = [
  "receivedDateTime",
  "sentDateTime",
  "createdDateTime",
  "lastModifiedDateTime",
  "modifiedDateTime",
  "date",
  "timestamp",
  "lastUpdated"
];
const URL_KEYS = ["webLink", "url", "href", "link", "webUrl"];
const ID_KEYS = ["id", "entityId", "uuid", "guid"];

function getString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
    if (v && typeof v === "object") {
      // dive one level: e.g. from.emailAddress.address
      const inner = v as Record<string, unknown>;
      for (const sub of ["address", "emailAddress", "name", "displayName"]) {
        const s = inner[sub];
        if (typeof s === "string" && s.trim()) return s;
        if (s && typeof s === "object") {
          const i2 = s as Record<string, unknown>;
          for (const sub2 of ["address", "name", "displayName"]) {
            const ss = i2[sub2];
            if (typeof ss === "string" && ss.trim()) return ss;
          }
        }
      }
    }
  }
  return undefined;
}

function formatDate(v: unknown): string | undefined {
  if (typeof v !== "string" && typeof v !== "number") return undefined;
  const d = new Date(v);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleString();
}

function truncate(s: string | undefined, n: number): string | undefined {
  if (s === undefined) return undefined;
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

function ItemCard({ item, index }: { item: unknown; index: number }) {
  if (item === null || typeof item !== "object") {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800">
        {String(item)}
      </div>
    );
  }
  const obj = item as Record<string, unknown>;
  const title = truncate(getString(obj, TITLE_KEYS) ?? `Élément #${index + 1}`, 100);
  const subtitle = truncate(getString(obj, SUBTITLE_KEYS), 100);
  const body = truncate(getString(obj, BODY_KEYS), 100);
  const dateRaw = DATE_KEYS.map((k) => obj[k]).find((v) => v !== undefined);
  const date = dateRaw !== undefined ? formatDate(dateRaw) : undefined;
  const url = getString(obj, URL_KEYS);
  const id = getString(obj, ID_KEYS);

  const usedKeys = new Set<string>([
    ...TITLE_KEYS,
    ...SUBTITLE_KEYS,
    ...BODY_KEYS,
    ...DATE_KEYS,
    ...URL_KEYS,
    ...ID_KEYS
  ]);
  const extraEntries = Object.entries(obj).filter(([k, v]) => {
    if (usedKeys.has(k)) return false;
    if (v === null || v === undefined) return false;
    if (typeof v === "object") return false; // skip nested for cards; show via details
    return true;
  });
  const nestedEntries = Object.entries(obj).filter(
    ([k, v]) => !usedKeys.has(k) && v !== null && typeof v === "object"
  );

  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 text-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold text-slate-900">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="hover:text-emerald-700 hover:underline">
              {title}
            </a>
          ) : (
            title
          )}
        </div>
        {date && <div className="text-[10px] text-slate-500">{date}</div>}
      </header>
      {subtitle && (
        <div className="text-xs text-slate-600">
          <span className="text-slate-400">de · </span>
          {subtitle}
        </div>
      )}
      {body && (
        <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">{body}</p>
      )}
      {(extraEntries.length > 0 || id) && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          {extraEntries.slice(0, 6).map(([k, v]) => (
            <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
              <span className="text-slate-400">{k}:</span> {truncate(String(v), 60)}
            </span>
          ))}
          {id && (
            <span
              title={id}
              className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-slate-400 ring-1 ring-slate-200"
            >
              id: {id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id}
            </span>
          )}
        </div>
      )}
      {nestedEntries.length > 0 && (
        <details className="mt-2 text-[10px]">
          <summary className="cursor-pointer text-slate-500">
            Données imbriquées ({nestedEntries.length})
          </summary>
          <KeyValueList obj={Object.fromEntries(nestedEntries)} />
        </details>
      )}
    </article>
  );
}

/* ----- KeyValueList: render an object as a definition list ----- */

function KeyValueList({ obj }: { obj: Record<string, unknown> }) {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-500">
        Objet vide.
      </div>
    );
  }
  return (
    <dl className="grid gap-x-3 gap-y-1 rounded-md border border-slate-200 bg-white p-3 text-xs sm:grid-cols-[max-content_1fr]">
      {entries.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="font-mono font-semibold text-slate-500">{k}</dt>
          <dd className="text-slate-800">
            <KeyValueValue value={v} />
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

function KeyValueValue({ value }: { value: unknown }) {  if (value === null) return <span className="text-slate-400">null</span>;
  if (value === undefined) return <span className="text-slate-400">—</span>;
  if (typeof value === "boolean") return <span className="font-mono">{value ? "true" : "false"}</span>;
  if (typeof value === "number") return <span className="font-mono">{value}</span>;
  if (typeof value === "string") {
    const date = formatDate(value);
    if (date && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return <span title={value}>{date}</span>;
    }
    if (/^https?:\/\//.test(value)) {
      return (
        <a href={value} target="_blank" rel="noreferrer" className="break-all text-emerald-700 underline">
          {value}
        </a>
      );
    }
    return <KeyValueString value={value} />;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">[]</span>;
    if (value.every((it) => typeof it !== "object" || it === null)) {
      return <span>{value.map((it) => String(it)).join(", ")}</span>;
    }
    return (
      <details>
        <summary className="cursor-pointer text-slate-500">[{value.length} élément(s)]</summary>
        <div className="mt-1">
          <ItemList items={value} />
        </div>
      </details>
    );
  }
  if (typeof value === "object") {
    return (
      <details>
        <summary className="cursor-pointer text-slate-500">{"{...}"}</summary>
        <div className="mt-1">
          <KeyValueList obj={value as Record<string, unknown>} />
        </div>
      </details>
    );
  }
  return <span>{String(value)}</span>;
}

function KeyValueString({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 100;
  if (value.length <= LIMIT) {
    return <span className="whitespace-pre-wrap break-words">{value}</span>;
  }
  const shown = expanded ? value : value.slice(0, LIMIT).trimEnd() + "…";
  return (
    <span className="whitespace-pre-wrap break-words">
      {shown}{" "}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="ml-1 text-[10px] text-emerald-700 underline hover:text-emerald-800"
      >
        {expanded ? "réduire" : `+${value.length - LIMIT} car.`}
      </button>
    </span>
  );
}

