export const WORKIQ_BASE_URL =
  process.env.NEXT_PUBLIC_WORKIQ_BASE_URL ?? "https://workiq.svc.cloud.microsoft";

export const WORKIQ_SCOPE = "api://workiq.svc.cloud.microsoft/WorkIQAgent.Ask";

export const WORKIQ_PERMISSION_GUID = "0b1715fd-f4bf-4c63-b16d-5be31f9847c2";

export const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID ?? "common";
export const DEFAULT_CLIENT_ID = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID ?? "";

export const ENDPOINTS = {
  rest: {
    createConversation: "/rest/conversations",
    chat: (id: string) => `/rest/conversations/${id}/chat`,
    chatOverStream: (id: string) => `/rest/conversations/${id}/chatOverStream`,
    betaCreateConversation: "/rest/beta/conversations",
    betaChat: (id: string) => `/rest/beta/conversations/${id}/chat`,
    betaChatOverStream: (id: string) => `/rest/beta/conversations/${id}/chatOverStream`
  },
  a2a: {
    root: "/a2a/",
    agentCard: "/a2a/.well-known/agent-card.json",
    agentCardFor: (agentId: string) => `/a2a/${agentId}/.well-known/agent-card.json`
  },
  mcp: {
    server: "/mcp",
    oauthProtectedResource: "/.well-known/oauth-protected-resource"
  }
} as const;
