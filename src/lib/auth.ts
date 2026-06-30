"use client";

import {
  Configuration,
  PublicClientApplication,
  AccountInfo,
  InteractionRequiredAuthError
} from "@azure/msal-browser";
import { DEFAULT_CLIENT_ID, DEFAULT_TENANT_ID, WORKIQ_SCOPE } from "./workiq-config";

const SETTINGS_KEY = "workiq-demo-settings";

export interface AppSettings {
  tenantId: string;
  clientId: string;
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { tenantId: DEFAULT_TENANT_ID, clientId: DEFAULT_CLIENT_ID };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        tenantId: parsed.tenantId || DEFAULT_TENANT_ID,
        clientId: parsed.clientId || DEFAULT_CLIENT_ID
      };
    }
  } catch {
    /* ignore */
  }
  return { tenantId: DEFAULT_TENANT_ID, clientId: DEFAULT_CLIENT_ID };
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

let cachedPca: PublicClientApplication | null = null;
let cachedKey = "";

export function getMsalInstance(settings: AppSettings): PublicClientApplication | null {
  if (!settings.clientId) return null;
  const key = `${settings.tenantId}:${settings.clientId}`;
  if (cachedPca && cachedKey === key) return cachedPca;

  const config: Configuration = {
    auth: {
      clientId: settings.clientId,
      authority: `https://login.microsoftonline.com/${settings.tenantId}`,
      redirectUri:
        typeof window !== "undefined" ? `${window.location.origin}/auth-callback` : "/auth-callback"
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false
    }
  };
  cachedPca = new PublicClientApplication(config);
  cachedKey = key;
  return cachedPca;
}

export async function signIn(pca: PublicClientApplication): Promise<AccountInfo> {
  const result = await pca.loginPopup({ scopes: [WORKIQ_SCOPE, "openid", "profile"] });
  pca.setActiveAccount(result.account);
  return result.account;
}

export function signOut(pca: PublicClientApplication): Promise<void> {
  return pca.logoutPopup();
}

export async function acquireWorkIqToken(pca: PublicClientApplication): Promise<string> {
  const account = pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  if (!account) throw new Error("No signed-in account. Sign in first.");
  try {
    const result = await pca.acquireTokenSilent({
      account,
      scopes: [WORKIQ_SCOPE]
    });
    return result.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      const result = await pca.acquireTokenPopup({
        account,
        scopes: [WORKIQ_SCOPE]
      });
      return result.accessToken;
    }
    throw err;
  }
}
