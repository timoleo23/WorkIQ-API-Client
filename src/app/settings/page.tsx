"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { WORKIQ_PERMISSION_GUID, WORKIQ_SCOPE } from "@/lib/workiq-config";

export default function SettingsPage() {
  const { settings, setSettings, account } = useAuth();
  const [tenantId, setTenantId] = useState(settings.tenantId);
  const [clientId, setClientId] = useState(settings.clientId);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setTenantId(settings.tenantId);
    setClientId(settings.clientId);
  }, [settings]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings({ tenantId: tenantId.trim() || "common", clientId: clientId.trim() });
    setSavedAt(Date.now());
  };

  const redirectUri =
    typeof window !== "undefined" ? `${window.location.origin}/auth-callback` : "/auth-callback";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configurez l&apos;application Microsoft Entra utilisée pour vous authentifier auprès de
          Work IQ.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="lg:col-span-2 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Tenant ID</label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="common ou GUID du tenant"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Utilisez <code>common</code>, <code>organizations</code>, ou un GUID/domaine de
              tenant.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Client ID (Application ID)</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="GUID de votre app registration Entra"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Enregistrer
            </button>
            {savedAt && (
              <span className="text-xs text-emerald-700">
                Enregistré ({new Date(savedAt).toLocaleTimeString()}). Rechargez la page si besoin.
              </span>
            )}
          </div>
          {account && (
            <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-900">
              Connecté en tant que <strong>{account.username}</strong>
            </div>
          )}
        </form>

        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
          <h2 className="text-sm font-semibold text-slate-900">Pré-requis de l&apos;app Entra</h2>
          <ul className="mt-3 space-y-3 text-xs">
            <li>
              <strong>Type :</strong> Single-page application (SPA).
            </li>
            <li>
              <strong>Redirect URI :</strong>
              <code className="ml-1 block overflow-auto rounded bg-white px-2 py-1 font-mono">
                {redirectUri}
              </code>
            </li>
            <li>
              <strong>API permission :</strong>
              <div className="mt-1 rounded bg-white p-2 font-mono">
                Delegated · <code>WorkIQAgent.Ask</code>
                <br />
                <span className="text-slate-500">{WORKIQ_PERMISSION_GUID}</span>
              </div>
            </li>
            <li>
              <strong>Scope demandé :</strong>
              <code className="ml-1 block overflow-auto rounded bg-white px-2 py-1 font-mono">
                {WORKIQ_SCOPE}
              </code>
            </li>
            <li>
              Admin consent est <strong>requis</strong> pour cette permission.
            </li>
            <li className="text-slate-500">
              Le démonstrateur stocke ces paramètres dans <code>localStorage</code> uniquement.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
