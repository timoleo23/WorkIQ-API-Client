/**
 * Catalogue statique des méthodes REST exposées par Work IQ.
 * Source : https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/rest/
 */
export interface RestMethodSpec {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  title: string;
  description: string;
  permissions: string[];
  requestBody?: string;
  responseBody?: string;
  stability: "stable" | "beta";
}

export const REST_METHODS: RestMethodSpec[] = [
  {
    id: "create-conversation",
    method: "POST",
    path: "/rest/conversations",
    title: "Create copilotConversation",
    description:
      "Crée une nouvelle conversation Copilot. L'`id` retourné est utilisé pour les tours suivants.",
    permissions: ["WorkIQAgent.Ask"],
    requestBody: "{}",
    responseBody: `{
  "id": "0d110e7e-2b7e-4270-a899-fd2af6fde333",
  "createdDateTime": "2026-09-30T15:28:46.156Z",
  "displayName": "",
  "status": "active",
  "turnCount": 0
}`,
    stability: "stable"
  },
  {
    id: "chat",
    method: "POST",
    path: "/rest/conversations/{id}/chat",
    title: "copilotConversation: chat (sync)",
    description:
      "Envoie un message dans une conversation existante en mode synchrone. Retourne la réponse complète.",
    permissions: ["WorkIQAgent.Ask"],
    requestBody: `{
  "message": { "text": "What meeting do I have at 9 AM tomorrow morning?" },
  "locationHint": { "timeZone": "America/New_York" }
}`,
    responseBody: `{
  "id": "0d110e7e-2b7e-4270-a899-fd2af6fde333",
  "status": "active",
  "turnCount": 1,
  "messages": [ { "role": "assistant", "text": "..." } ]
}`,
    stability: "stable"
  },
  {
    id: "chat-stream",
    method: "POST",
    path: "/rest/conversations/{id}/chatOverStream",
    title: "copilotConversation: chatOverStream",
    description: "Envoie un message en streaming (Server-Sent Events). Idéal pour afficher la réponse au fil de l'eau.",
    permissions: ["WorkIQAgent.Ask"],
    requestBody: `{
  "message": { "text": "Summarize my unread emails" },
  "locationHint": { "timeZone": "Europe/Paris" }
}`,
    responseBody: `event: message
data: { "delta": "Voici un résumé..." }

event: done
data: { "turnCount": 2 }`,
    stability: "stable"
  },
  {
    id: "chat-with-files",
    method: "POST",
    path: "/rest/conversations/{id}/chat",
    title: "Chat avec fichiers OneDrive/SharePoint comme contexte",
    description:
      "Fournit un ou plusieurs fichiers OneDrive/SharePoint comme grounding pour la réponse.",
    permissions: ["WorkIQAgent.Ask"],
    requestBody: `{
  "message": { "text": "Compare these two proposals" },
  "locationHint": { "timeZone": "Europe/Paris" },
  "contextualResources": {
    "fileUrls": [
      "https://contoso.sharepoint.com/sites/x/Shared Documents/proposal-a.docx",
      "https://contoso.sharepoint.com/sites/x/Shared Documents/proposal-b.docx"
    ]
  }
}`,
    stability: "stable"
  },
  {
    id: "chat-no-web",
    method: "POST",
    path: "/rest/conversations/{id}/chat",
    title: "Chat sans grounding web (single-turn)",
    description: "Désactive le web grounding pour ce tour. Action single-turn.",
    permissions: ["WorkIQAgent.Ask"],
    requestBody: `{
  "message": { "text": "What's our Q3 OKR status?" },
  "locationHint": { "timeZone": "Europe/Paris" },
  "contextualResources": { "webSearch": false }
}`,
    stability: "stable"
  },
  {
    id: "beta-create-conversation",
    method: "POST",
    path: "/rest/beta/conversations",
    title: "Create copilotConversation (beta)",
    description: "Variante beta de la création de conversation. Susceptible de changer — non recommandée en production.",
    permissions: ["WorkIQAgent.Ask"],
    requestBody: "{}",
    stability: "beta"
  }
];
