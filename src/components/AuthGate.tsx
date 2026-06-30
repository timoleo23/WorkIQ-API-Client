"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Affiche un avertissement si l'utilisateur n'est pas configuré / connecté.
 * Wraps children — children sont rendus mais l'UI montre un bandeau si pas auth.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, pca, account } = useAuth();
  if (!ready) return <div className="p-8 text-sm text-slate-500">Chargement…</div>;

  return (
    <>
      {!pca && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Configuration requise.</strong>{" "}
          Renseignez votre <strong>clientId</strong> Entra dans la page{" "}
          <Link href="/settings" className="underline font-medium">
            Settings
          </Link>{" "}
          pour pouvoir vous authentifier et appeler le service Work IQ.
        </div>
      )}
      {pca && !account && (
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <strong>Non connecté.</strong> Cliquez sur <em>Sign in with Microsoft</em> en haut à droite
          pour obtenir un token Entra et déclencher des appels réels. Vous pouvez tout de même
          parcourir les specs et les exemples ci-dessous.
        </div>
      )}
      {children}
    </>
  );
}
