"use client";

import { useMemo, useState } from "react";

interface Props {
  value: unknown;
  label?: string;
  maxHeight?: number;
}

export function JsonViewer({ value, label, maxHeight = 480 }: Props) {
  const [copied, setCopied] = useState(false);

  /** Normalise la valeur en JSON indenté quand c'est possible. */
  const { text, isJson } = useMemo(() => normalize(value), [value]);

  const html = useMemo(
    () => (isJson ? highlight(text) : escapeHtml(text)),
    [text, isJson]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-1.5">
        <span className="text-xs font-medium text-slate-300">{label ?? "JSON"}</span>
        <button
          onClick={copy}
          className="rounded border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300 hover:bg-slate-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="json-viewer overflow-auto px-3 py-2"
        style={{ maxHeight }}
        // Le contenu est échappé puis tokenisé localement — pas de HTML externe.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

/** Retourne { text indenté, isJson } pour highlightage conditionnel. */
function normalize(value: unknown): { text: string; isJson: boolean } {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith('"')) {
      try {
        const parsed = JSON.parse(value);
        return { text: JSON.stringify(parsed, null, 2), isJson: true };
      } catch {
        /* pas du JSON → rendu brut */
      }
    }
    return { text: value, isJson: false };
  }
  if (value === undefined) return { text: "undefined", isJson: false };
  try {
    return { text: JSON.stringify(value, null, 2), isJson: true };
  } catch {
    return { text: String(value), isJson: false };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Coloration syntaxique JSON.
 * Couleurs (sur fond slate-900) :
 *   clés    → sky-300
 *   strings → emerald-300
 *   nombres → amber-300
 *   bool    → fuchsia-300
 *   null    → slate-400 italic
 */
function highlight(json: string): string {
  const escaped = escapeHtml(json);
  // Capture : (1) strings (avec ":" optionnel = clé), (2) bool/null, (3) nombres
  const re = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  return escaped.replace(re, (match, str, colon, word) => {
    if (str !== undefined) {
      if (colon) {
        return `<span class="text-sky-300">${str}</span><span class="text-slate-500">${colon}</span>`;
      }
      return `<span class="text-emerald-300">${str}</span>`;
    }
    if (word === "true" || word === "false") {
      return `<span class="text-fuchsia-300">${word}</span>`;
    }
    if (word === "null") {
      return `<span class="italic text-slate-400">${word}</span>`;
    }
    return `<span class="text-amber-300">${match}</span>`;
  });
}
