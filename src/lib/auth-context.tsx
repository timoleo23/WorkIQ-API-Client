"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { AccountInfo, PublicClientApplication } from "@azure/msal-browser";
import {
  acquireWorkIqToken,
  getMsalInstance,
  loadSettings,
  saveSettings,
  signIn,
  signOut,
  type AppSettings
} from "./auth";

interface AuthCtx {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  pca: PublicClientApplication | null;
  account: AccountInfo | null;
  ready: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>({ tenantId: "common", clientId: "" });
  const [pca, setPca] = useState<PublicClientApplication | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [ready, setReady] = useState(false);

  // hydrate settings from localStorage on first mount
  useEffect(() => {
    const s = loadSettings();
    setSettingsState(s);
    const instance = getMsalInstance(s);
    if (instance) {
      instance
        .initialize()
        .then(() => {
          const active = instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
          if (active) instance.setActiveAccount(active);
          setPca(instance);
          setAccount(active);
          setReady(true);
        })
        .catch(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const setSettings = useCallback((next: AppSettings) => {
    saveSettings(next);
    setSettingsState(next);
    const instance = getMsalInstance(next);
    if (instance) {
      instance
        .initialize()
        .then(() => {
          setPca(instance);
          setAccount(instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null);
        });
    } else {
      setPca(null);
      setAccount(null);
    }
  }, []);

  const login = useCallback(async () => {
    if (!pca) throw new Error("Configure your Entra clientId in Settings first.");
    const a = await signIn(pca);
    setAccount(a);
  }, [pca]);

  const logout = useCallback(async () => {
    if (!pca) return;
    await signOut(pca);
    setAccount(null);
  }, [pca]);

  const getToken = useCallback(async () => {
    if (!pca) throw new Error("MSAL not initialized");
    return acquireWorkIqToken(pca);
  }, [pca]);

  const value = useMemo<AuthCtx>(
    () => ({ settings, setSettings, pca, account, ready, login, logout, getToken }),
    [settings, setSettings, pca, account, ready, login, logout, getToken]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
