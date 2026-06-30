"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const tabs = [
  { href: "/", label: "Accueil", color: "text-slate-700" },
  { href: "/rest", label: "REST", color: "text-amber-700", dot: "bg-rest" },
  { href: "/a2a", label: "A2A", color: "text-violet-700", dot: "bg-a2a" },
  { href: "/mcp", label: "MCP", color: "text-emerald-700", dot: "bg-mcp" },
  { href: "/settings", label: "Settings", color: "text-slate-700" }
];

export function TopNav() {
  const pathname = usePathname();
  const { account, login, logout, ready, pca } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-white font-bold">
            W
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Work IQ API</div>
            <div className="text-xs text-slate-500 leading-tight">Démonstrateur d&apos;intégration</div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {t.dot && <span className={`h-2 w-2 rounded-full ${t.dot}`} />}
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {ready && account && (
            <>
              <div className="hidden text-right md:block">
                <div className="text-xs font-medium text-slate-900">{account.name ?? account.username}</div>
                <div className="text-[10px] text-slate-500">{account.username}</div>
              </div>
              <button
                onClick={() => void logout()}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          )}
          {ready && !account && (
            <button
              onClick={() => void login()}
              disabled={!pca}
              title={!pca ? "Configurez d'abord clientId dans Settings" : ""}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Sign in with Microsoft
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
