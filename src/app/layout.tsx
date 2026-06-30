import { AuthProvider } from "@/lib/auth-context";
import { TopNav } from "@/components/TopNav";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Work IQ API — Démonstrateur",
  description:
    "Démonstrateur des capacités d'intégration de Microsoft Work IQ API selon les protocoles REST, A2A et MCP."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <TopNav />
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
          <footer className="mx-auto max-w-7xl px-6 pb-10 text-xs text-slate-400">
            Démonstrateur non-officiel. Spec source :{" "}
            <a
              href="https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/api-overview"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-slate-600"
            >
              Microsoft Learn — Work IQ API
            </a>
            .
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
