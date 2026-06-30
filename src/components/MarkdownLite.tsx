"use client";

import { Fragment, type ReactNode } from "react";

interface Props {
  text: string;
  /** Classes appliquées au wrapper. */
  className?: string;
}

/**
 * Mini-renderer markdown pour les réponses Work IQ (texte produit par MS Graph Copilot).
 * Couvre uniquement ce qui apparaît réellement dans les `messages[].text` :
 *   - titres `#`..`######`
 *   - séparateur `---`
 *   - listes ordonnées `1. ` et puces `- ` / `* `
 *   - gras `**...**`, italique `*...*`
 *   - code inline `` `...` ``
 *   - liens `[texte](https://...)`
 *   - sauts de ligne préservés
 *
 * Volontairement minimal — pas de dépendance externe.
 */
export function MarkdownLite({ text, className }: Props) {
  const blocks = parseBlocks(text);
  return (
    <div className={className ?? "space-y-2 text-sm leading-relaxed"}>
      {blocks.map((b, i) => (
        <Fragment key={i}>{renderBlock(b, i)}</Fragment>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloc parsing
// ---------------------------------------------------------------------------

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; lines: string[] };

function parseBlocks(input: string): Block[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "paragraph", lines: para });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };
  const flushAll = () => {
    flushPara();
    flushList();
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    if (!line.trim()) {
      flushAll();
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      flushAll();
      blocks.push({ type: "hr" });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (h) {
      flushAll();
      blocks.push({ type: "heading", level: h[1].length, text: h[2] });
      continue;
    }
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    // Ligne indentée qui prolonge l'item courant
    if (list && /^\s{2,}\S/.test(raw)) {
      const idx = list.items.length - 1;
      if (idx >= 0) {
        list.items[idx] += "\n" + line.trim();
        continue;
      }
    }
    flushList();
    para.push(line);
  }
  flushAll();
  return blocks;
}

function renderBlock(b: Block, key: number): ReactNode {
  switch (b.type) {
    case "hr":
      return <hr key={key} className="border-slate-300" />;
    case "heading": {
      const cls =
        b.level <= 2
          ? "text-base font-bold text-slate-900"
          : b.level === 3
          ? "text-sm font-bold text-slate-900"
          : "text-xs font-semibold uppercase tracking-wide text-slate-600";
      return (
        <div key={key} className={cls}>
          {renderInline(b.text)}
        </div>
      );
    }
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      const cls = b.ordered
        ? "list-decimal space-y-1 pl-5 marker:text-slate-400"
        : "list-disc space-y-1 pl-5 marker:text-slate-400";
      return (
        <Tag key={key} className={cls}>
          {b.items.map((it, i) => (
            <li key={i} className="whitespace-pre-line">
              {renderInline(it)}
            </li>
          ))}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p key={key} className="whitespace-pre-line">
          {b.lines.map((l, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {renderInline(l)}
            </Fragment>
          ))}
        </p>
      );
  }
}

// ---------------------------------------------------------------------------
// Inline parsing — links / bold / italic / code
// ---------------------------------------------------------------------------

const INLINE_RE =
  /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*\n]+?)\*\*|`([^`\n]+?)`|\*([^*\n]+?)\*/g;

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0;
    if (idx > cursor) out.push(text.slice(cursor, idx));
    if (m[1] !== undefined && m[2] !== undefined) {
      out.push(
        <a
          key={key++}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-amber-700 underline decoration-amber-400 underline-offset-2 hover:text-amber-900"
        >
          {m[1]}
        </a>
      );
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {m[3]}
        </strong>
      );
    } else if (m[4] !== undefined) {
      out.push(
        <code
          key={key++}
          className="rounded bg-slate-200 px-1 py-px font-mono text-[11px] text-slate-800"
        >
          {m[4]}
        </code>
      );
    } else if (m[5] !== undefined) {
      out.push(
        <em key={key++} className="italic">
          {m[5]}
        </em>
      );
    }
    cursor = idx + m[0].length;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}
