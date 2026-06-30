/**
 * Catalogue statique des outils exposés par le serveur Work IQ MCP.
 * Source : https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/mcp/tool-reference
 */
export type McpToolCategory = "entity" | "copilot" | "schema";

/**
 * Discovery metadata for a parameter — lets the UI suggest valid values.
 *
 * - `search_paths`: call the MCP `search_paths` tool with `filter`. The returned
 *   list of paths populates a dropdown. Optionally `postFilter` is a JS RegExp
 *   string applied client-side to narrow the result (used to distinguish
 *   actions vs. functions vs. plain entity paths).
 * - `static`: a curated, hard-coded list of common values — useful when there
 *   is no introspection endpoint (e.g. the `filter` arg of `search_paths`
 *   itself, or the `operationType` enum of `get_schema`).
 */
export interface McpToolParameterDiscovery {
  source: "search_paths" | "static";
  /** Filter passed to search_paths when source === "search_paths". */
  filter?: string;
  /** Optional client-side regex (string) further filtering the result list. */
  postFilter?: string;
  /** Hard-coded values when source === "static". */
  values?: string[];
  /** Short label shown next to the discover button. */
  hint?: string;
}

export interface McpToolParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
  discovery?: McpToolParameterDiscovery;
}

export interface McpToolSpec {
  name: string;
  category: McpToolCategory;
  description: string;
  parameters: McpToolParameter[];
  sampleArguments: Record<string, unknown>;
}

export const MCP_TOOLS: McpToolSpec[] = [
  {
    name: "fetch",
    category: "entity",
    description:
      "Lit une ou plusieurs entités à partir de leur chemin Microsoft Graph (lecture parallèle).",
    parameters: [
      {
        name: "entityUrls",
        type: "string[]",
        required: true,
        description: "Liste des chemins relatifs à lire (ex: /me/messages, /me/events/{id})."
      },
      { name: "agentId", type: "string", required: false, description: "Réservé pour usage futur." }
    ],
    sampleArguments: { entityUrls: ["/me/messages"] }
  },
  {
    name: "create_entity",
    category: "entity",
    description: "Crée une nouvelle entité dans une collection (mail draft, event, etc.).",
    parameters: [
      { name: "parentUrl", type: "string", required: true, description: "Chemin de la collection (ex: /me/events)." },
      {
        name: "jsonBody",
        type: "string",
        required: true,
        description: "Corps JSON sérialisé (chaîne JSON, pas un objet)."
      },
      { name: "agentId", type: "string", required: false, description: "Réservé." }
    ],
    sampleArguments: { parentUrl: "/me/messages", jsonBody: '{ "subject": "Hello world!" }' }
  },
  {
    name: "update_entity",
    category: "entity",
    description: "Met à jour une entité existante.",
    parameters: [
      { name: "entityUrl", type: "string", required: true, description: "Chemin de l'entité." },
      { name: "jsonBody", type: "string", required: true, description: "Corps JSON sérialisé." },
      { name: "agentId", type: "string", required: false, description: "Réservé." }
    ],
    sampleArguments: { entityUrl: "/me/messages/{id}", jsonBody: '{ "subject": "Updated" }' }
  },
  {
    name: "delete_entity",
    category: "entity",
    description: "Supprime une entité.",
    parameters: [
      { name: "entityUrl", type: "string", required: true, description: "Chemin relatif à supprimer." },
      { name: "agentId", type: "string", required: false, description: "Réservé." }
    ],
    sampleArguments: { entityUrl: "/me/messages/{id}" }
  },
  {
    name: "do_action",
    category: "entity",
    description: "Exécute une action à effet de bord (envoi de mail, copie, déplacement…).",
    parameters: [
      {
        name: "actionUrl",
        type: "string",
        required: true,
        description: "Chemin relatif de l'action.",
        discovery: {
          source: "search_paths",
          filter: ".*",
          postFilter: "/(send|copy|move|reply|replyAll|forward|markAsRead|markAsJunk|accept|decline|tentativelyAccept|cancel|snooze|delta|invite|checkin|checkout|publish|unpublish|share|permanentDelete|recall|empty|setOnlineMeeting)$",
          values: [
            "/me/sendMail",
            "/me/messages/{id}/send",
            "/me/messages/{id}/reply",
            "/me/messages/{id}/replyAll",
            "/me/messages/{id}/forward",
            "/me/messages/{id}/move",
            "/me/messages/{id}/copy",
            "/me/messages/{id}/markAsJunk",
            "/me/events/{id}/accept",
            "/me/events/{id}/decline",
            "/me/events/{id}/tentativelyAccept",
            "/me/events/{id}/cancel",
            "/me/events/{id}/forward",
            "/me/events/{id}/snoozeReminder",
            "/me/drive/items/{id}/copy",
            "/me/drive/items/{id}/move",
            "/me/drive/items/{id}/restore",
            "/me/drive/items/{id}/permanentDelete",
            "/me/drive/items/{id}/invite",
            "/me/chats/{id}/sendActivityNotification",
            "/me/todo/lists/{listId}/tasks/{id}/move"
          ],
          hint: "Actions Graph fréquentes (send/copy/move/reply…)"
        }
      },
      { name: "jsonBody", type: "string", required: false, description: "Corps JSON sérialisé (optionnel)." },
      { name: "agentId", type: "string", required: false, description: "Réservé." }
    ],
    sampleArguments: { actionUrl: "/me/messages/{id}/send" }
  },
  {
    name: "call_function",
    category: "entity",
    description: "Appelle une fonction Microsoft Graph pour calculer des données dérivées (calendarView, delta, search).",
    parameters: [
      {
        name: "functionUrl",
        type: "string",
        required: true,
        description: "Chemin relatif de la fonction.",
        discovery: {
          source: "search_paths",
          filter: ".*",
          postFilter: "/(calendarView|delta|search|findMeetingTimes|getSchedule|reminderView|instances|sendActivityNotification|getNotebookFromWebUrl|count|getRecentNotebooks|getByPath|recent|sharedWithMe|following|getMemberObjects|getMemberGroups|checkMemberObjects|checkMemberGroups|preview|content)(\\(|$)",
          values: [
            "/me/calendarView?startdatetime=2026-06-01T00:00:00Z&enddatetime=2026-06-08T00:00:00Z",
            "/me/calendar/getSchedule",
            "/me/findMeetingTimes",
            "/me/reminderView(StartDateTime='2026-06-01T00:00:00Z',EndDateTime='2026-06-08T00:00:00Z')",
            "/me/events/delta",
            "/me/messages/delta",
            "/me/contacts/delta",
            "/me/mailFolders/delta",
            "/me/messages?$search=\"project\"",
            "/me/drive/root/search(q='budget')",
            "/me/drive/recent",
            "/me/drive/sharedWithMe",
            "/me/drive/following",
            "/me/joinedTeams/getAllMessages",
            "/me/chats/getAllMessages",
            "/me/getMemberGroups",
            "/me/getMemberObjects"
          ],
          hint: "Fonctions Graph (calendarView, delta, search…)"
        }
      },
      { name: "agentId", type: "string", required: false, description: "Réservé." }
    ],
    sampleArguments: {
      functionUrl: "/me/calendarView?startdatetime=2026-06-01T00:00:00Z&enddatetime=2026-06-08T00:00:00Z"
    }
  },
  {
    name: "ask",
    category: "copilot",
    description: "Pose une question en langage naturel à Microsoft 365 Copilot ou à un agent ciblé.",
    parameters: [
      { name: "question", type: "string", required: true, description: "La question en langage naturel." },
      { name: "agentId", type: "string", required: false, description: "Cible un agent spécifique." },
      {
        name: "fileUrls",
        type: "string[]",
        required: false,
        description: "URLs OneDrive/SharePoint utilisées comme contexte."
      },
      {
        name: "conversationId",
        type: "string",
        required: false,
        description: "ID de conversation pour le multi-tour."
      },
      { name: "timeZone", type: "string", required: false, description: "Identifiant IANA (ex: Europe/Paris)." }
    ],
    sampleArguments: { question: "Quelles réunions ai-je aujourd'hui ?", timeZone: "Europe/Paris" }
  },
  {
    name: "list_agents",
    category: "copilot",
    description: "Liste les agents disponibles utilisables avec `ask`.",
    parameters: [],
    sampleArguments: {}
  },
  {
    name: "get_schema",
    category: "schema",
    description: "Récupère le schéma OpenAPI d'une opération (JSON Schema ou TypeScript).",
    parameters: [
      {
        name: "path",
        type: "string",
        required: false,
        description: "Chemin API (ex: /me/messages).",
        discovery: {
          source: "search_paths",
          filter: ".*",
          hint: "Tous les chemins découverts via search_paths"
        }
      },
      { name: "operationIds", type: "string", required: false, description: "Operation ID (ex: me.CreateMessages)." },
      {
        name: "operationType",
        type: "string",
        required: true,
        description: "fetch | create | update",
        discovery: {
          source: "static",
          values: ["fetch", "create", "update"],
          hint: "Énumération spéc."
        }
      },
      {
        name: "format",
        type: "string",
        required: false,
        description: "jsonschema | typescript",
        discovery: {
          source: "static",
          values: ["jsonschema", "typescript"],
          hint: "Énumération spéc."
        }
      }
    ],
    sampleArguments: { path: "/me/messages", operationType: "fetch" }
  },
  {
    name: "search_paths",
    category: "schema",
    description: "Découvre les chemins API disponibles par préfixe ou regex.",
    parameters: [
      {
        name: "filter",
        type: "string",
        required: true,
        description: "Préfixe ou regex (ex: messages, .*calendar.*).",
        discovery: {
          source: "static",
          values: [
            "messages",
            "events",
            "calendarView",
            "contacts",
            "drive",
            "sites",
            "users",
            "me",
            "teams",
            "chats",
            "groups",
            "planner",
            "todo",
            "directoryObjects",
            ".*calendar.*",
            ".*delta$",
            ".*/send$"
          ],
          hint: "Préfixes et regex usuels"
        }
      }
    ],
    sampleArguments: { filter: "messages" }
  }
];

export const MCP_CATEGORY_META: Record<
  McpToolCategory,
  { label: string; description: string; color: string }
> = {
  entity: {
    label: "Entity tools",
    description: "CRUD et actions sur les ressources Microsoft 365 (Graph relative paths).",
    color: "bg-emerald-50 text-emerald-800 ring-emerald-200"
  },
  copilot: {
    label: "Copilot tools",
    description: "Invocation d'un agent Microsoft 365 Copilot en langage naturel.",
    color: "bg-violet-50 text-violet-800 ring-violet-200"
  },
  schema: {
    label: "Schema tools",
    description: "Découverte runtime des chemins API et de leurs schémas OpenAPI.",
    color: "bg-amber-50 text-amber-800 ring-amber-200"
  }
};
