import Link from "next/link";

const cards = [
  {
    href: "/rest",
    title: "REST API",
    tag: "REST",
    color: "from-amber-50 to-amber-100 ring-amber-200",
    badge: "bg-rest text-white",
    description:
      "API conversationnelle request/response pour les agents service-hosted et les orchestrateurs.",
    bullets: [
      "POST /rest/conversations — créer une conversation",
      "POST /{id}/chat — multi-tour synchrone",
      "POST /{id}/chatOverStream — streaming SSE"
    ],
    cta: "Voir les méthodes REST"
  },
  {
    href: "/a2a",
    title: "A2A (Agent-to-Agent)",
    tag: "A2A",
    color: "from-violet-50 to-violet-100 ring-violet-200",
    badge: "bg-a2a text-white",
    description:
      "Protocole JSON-RPC 2.0 pour la délégation et la collaboration multi-agents. v1.0 et v0.3 supportées.",
    bullets: [
      "GET .well-known/agent-card.json — découverte",
      "SendMessage / GetTask / CancelTask",
      "Multi-tour via contextId"
    ],
    cta: "Découvrir l'agent Work IQ"
  },
  {
    href: "/mcp",
    title: "Remote MCP",
    tag: "MCP",
    color: "from-emerald-50 to-emerald-100 ring-emerald-200",
    badge: "bg-mcp text-white",
    description:
      "Serveur MCP exposant 10 outils génériques pour les assistants IA (IDE, CLI, copilots).",
    bullets: [
      "6 entity tools (fetch, create, update, delete, do_action, call_function)",
      "2 copilot tools (ask, list_agents)",
      "2 schema tools (search_paths, get_schema)"
    ],
    cta: "Explorer les outils MCP"
  }
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Microsoft Work IQ
        </div>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Démonstrateur des capacités d&apos;intégration Work IQ
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
          Work IQ expose Microsoft&nbsp;365 comme une couche d&apos;intelligence sécurisée et
          permission-aware. Ce démonstrateur teste les trois modes d&apos;intégration officiels —
          chacun avec une expérience visuelle alignée sur la nature du protocole.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group relative flex flex-col rounded-2xl border bg-gradient-to-br p-6 ring-1 ${c.color} transition hover:-translate-y-0.5 hover:shadow-lg`}
          >
            <span
              className={`mb-4 inline-flex w-fit rounded px-2 py-0.5 text-[10px] font-bold tracking-wider ${c.badge}`}
            >
              {c.tag}
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{c.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{c.description}</p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
              {c.bullets.map((b) => (
                <li key={b} className="flex gap-1.5">
                  <span className="text-slate-400">•</span>
                  <span className="font-mono">{b}</span>
                </li>
              ))}
            </ul>
            <span className="mt-6 text-sm font-medium text-slate-900 group-hover:underline">
              {c.cta} →
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Comment ça marche</h2>
        <ol className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <li className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">Étape 1</div>
            <div className="mt-1 font-medium">Configurer Entra ID</div>
            <p className="mt-1 text-xs text-slate-600">
              Renseignez votre <code>tenantId</code> et le <code>clientId</code> d&apos;une app
              registration ayant la permission déléguée{" "}
              <code className="font-mono">WorkIQAgent.Ask</code>.
            </p>
          </li>
          <li className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">Étape 2</div>
            <div className="mt-1 font-medium">Se connecter</div>
            <p className="mt-1 text-xs text-slate-600">
              MSAL.js demande un access token sur le scope{" "}
              <code className="font-mono">api://workiq.svc.cloud.microsoft/WorkIQAgent.Ask</code>.
            </p>
          </li>
          <li className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">Étape 3</div>
            <div className="mt-1 font-medium">Tester</div>
            <p className="mt-1 text-xs text-slate-600">
              Le token est relayé par un proxy Next.js (<code>/api/proxy</code>) vers{" "}
              <code className="font-mono">workiq.svc.cloud.microsoft</code>. Toutes les requêtes et
              réponses sont visibles dans l&apos;UI.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
