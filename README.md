# Work IQ API Demonstrator

> Local web playground for the three official integration modes of the
> **[Microsoft Work IQ API](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/api-overview)**:
> REST · A2A · MCP — with full Entra auth, live request/response inspection,
> and a rich chat UI rendering of Copilot replies.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Stack](https://img.shields.io/badge/TypeScript-5-blue) ![Stack](https://img.shields.io/badge/Tailwind-3-38bdf8) ![Auth](https://img.shields.io/badge/Auth-MSAL%20Browser-orange) ![Runs](https://img.shields.io/badge/Runs-Local%20only-green)

---

## Table of contents

1. [What it does](#what-it-does)
2. [Functional specifications](#functional-specifications)
3. [Quick start — install with an AI agent (Microsoft Scout / vibe coding)](#quick-start--install-with-an-ai-agent-microsoft-scout--vibe-coding)
4. [Manual install (humans)](#manual-install-humans)
5. [Entra app registration (required)](#entra-app-registration-required)
6. [Configuration](#configuration)
7. [Architecture](#architecture)
8. [Troubleshooting](#troubleshooting)
9. [Security & distribution notes](#security--distribution-notes)
10. [References](#references)
11. [License](#license)

---

## What it does

This is a **local-only** Next.js 14 web app that lets you sign in with your
Microsoft 365 work account and exercise every Work IQ API surface from a
friendly UI. It is designed to demonstrate, teach, and debug Work IQ
integrations — not to host them in production.

| Mode  | Page    | Capability                                                                |
| ----- | ------- | ------------------------------------------------------------------------- |
| REST  | `/rest` | List of REST methods + multi-turn "Try-it" panel with rendered chat reply |
| A2A   | `/a2a`  | Agent Card discovery + JSON-RPC `SendMessage` chat with envelope viewer   |
| MCP   | `/mcp`  | Tool grid + per-tool `tools/call` invocation with argument forms          |

Every request to `https://workiq.svc.cloud.microsoft` flows through a thin
**Next.js server proxy** (`/api/proxy`, `/api/mcp`) that forwards the user's
delegated Entra access token (acquired browser-side via MSAL). This avoids
CORS issues while keeping the strictly delegated-permission model the
Work IQ service requires.

---

## Functional specifications

### In scope

- **Three protocol playgrounds** (REST, A2A, MCP) with side-by-side request &
  response visibility — headers, status, elapsed time, raw JSON, and a
  rendered chat bubble.
- **Microsoft Entra ID delegated sign-in** (MSAL Browser, popup flow) using a
  user-supplied SPA app registration.
- **Settings page** to enter / change `tenantId` and `clientId` at runtime
  (persisted to `localStorage` — no backend storage).
- **JSON viewer** with syntax highlighting and a Markdown-lite renderer for
  Copilot replies (headings, lists, bold/italic, code, links open in new tab).
- **REST conversation state**: creates a `conversationId`, then reuses it for
  follow-up `chat` calls.
- **A2A context propagation**: captures the returned `contextId` and re-sends
  it for subsequent turns.
- **MCP tool discovery**: parses the catalogue, presents 10 documented tools,
  and exposes the raw `tools/call` invocation per tool.

### Out of scope

- Production hosting (no SSL, no telemetry, no rate limiting).
- App-only / client-credential flows (Work IQ requires delegated auth).
- Streaming UI for `chatOverStream` (the proxy supports SSE but the UI uses
  the synchronous variant for clarity).
- Persistence of conversation history (cleared on page reload).

### Non-functional

- **Runs locally only** on `http://localhost:3000`.
- **Zero credentials in source.** All secrets live in `.env.local` (git-ignored)
  or in the browser's localStorage.
- **No backend database** — the Next.js server only proxies HTTP calls.

---

## Quick start — install with an AI agent (Microsoft Scout / vibe coding)

You can have an AI coding agent (Microsoft Scout, GitHub Copilot Chat,
Claude, Cursor, etc.) clone and configure the app end-to-end. Open your
agent and paste the prompt below.

> **Prompt to paste in Microsoft Scout (or any AI coding agent):**
>
> ```
> Install the Work IQ API Demonstrator locally from
> https://github.com/timoleo23/WorkIQ-API-Client.
>
> Follow these steps:
> 1. Clone the repo and run `npm install` at the project root.
> 2. Copy .env.example to .env.local.
> 3. Open a browser to https://entra.microsoft.com → App registrations →
>    "New registration":
>      - Name: "Work IQ API Demonstrator (local)"
>      - Supported account types: "Accounts in this organizational directory only"
>      - Redirect URI: Platform = "Single-page application",
>        URI = "http://localhost:3000/auth-callback"
>    Create the app, then on the new app's Overview page copy:
>      - "Application (client) ID"  →  fill NEXT_PUBLIC_ENTRA_CLIENT_ID in .env.local
>      - "Directory (tenant) ID"    →  fill NEXT_PUBLIC_ENTRA_TENANT_ID in .env.local
> 4. In the app registration, go to "API permissions" → "Add a permission" →
>    "APIs my organization uses" → search for "Work IQ" (or paste GUID
>    0b1715fd-f4bf-4c63-b16d-5be31f9847c2) → Delegated permission
>    "WorkIQAgent.Ask" → Add.
> 5. Click "Grant admin consent for <tenant>". This step requires a
>    Microsoft Entra **Global Administrator** (or Privileged Role Admin /
>    Cloud App Admin) account.
> 6. Make sure the Work IQ service is enabled for the tenant — see
>    https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/enable-work-iq
> 7. Run `npm run dev` and open http://localhost:3000.
> 8. Sign in with a tenant user that has Microsoft 365 data (mail, calendar,
>    Teams, OneDrive/SharePoint) — the same identity the AI service will
>    reason over.
>
> Verify the install by sending a message on the /rest page; the assistant
> should reply with a Markdown-formatted answer rendered in the chat bubble.
> Do NOT commit .env.local. Do NOT change the redirect URI.
> ```

The agent should be able to complete steps 1, 2, 7, and 8 autonomously, and
will guide you through steps 3–6 in the Entra portal (which require an
interactive browser session and Global Admin privileges for consent).

---

## Manual install (humans)

### Prerequisites

- **Node.js 20+** and npm (or pnpm / yarn).
- **Microsoft 365 tenant** with [Work IQ enabled](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/enable-work-iq).
- A **Microsoft Entra Global Administrator** account (or equivalent) to grant
  admin consent on the `WorkIQAgent.Ask` delegated permission — this is a
  one-time setup step.
- A signed-in tenant user account with the M365 data the API should reason
  over (mail, calendar, OneDrive / SharePoint, Teams).

### Steps

```bash
# 1. Clone
git clone https://github.com/timoleo23/WorkIQ-API-Client.git
cd WorkIQ-API-Client

# 2. Install dependencies
npm install

# 3. Configure (see "Entra app registration" + "Configuration" below)
cp .env.example .env.local
# then edit .env.local with your tenant + client IDs

# 4. Run
npm run dev
```

Open <http://localhost:3000>.

---

## Entra app registration (required)

This is the **only** server-side prerequisite. Without it the app cannot
acquire a Work IQ access token.

### Create the SPA registration

1. Go to the **[Microsoft Entra admin center](https://entra.microsoft.com)** → **Identity** → **Applications** → **App registrations** → **+ New registration**.
2. Fill in:
   - **Name**: `Work IQ API Demonstrator (local)` (any name works).
   - **Supported account types**: `Accounts in this organizational directory only` (single tenant) — multi-tenant also works if your org allows it.
   - **Redirect URI**:
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:3000/auth-callback`
3. Click **Register**.

Copy from the new app's **Overview** page:

| Field                       | Goes into                       |
| --------------------------- | ------------------------------- |
| **Application (client) ID** | `NEXT_PUBLIC_ENTRA_CLIENT_ID`   |
| **Directory (tenant) ID**   | `NEXT_PUBLIC_ENTRA_TENANT_ID`   |

### Add the Work IQ delegated permission

1. In the app registration, go to **API permissions** → **+ Add a permission**.
2. Pick **APIs my organization uses**, search for **Work IQ** (or paste the GUID `0b1715fd-f4bf-4c63-b16d-5be31f9847c2`).
3. Select **Delegated permissions** → tick **`WorkIQAgent.Ask`** → **Add permissions**.

### Grant admin consent — **requires Global Administrator**

> ⚠️ **This step requires a Microsoft Entra Global Administrator account**
> (or a built-in role that can grant admin consent: *Privileged Role
> Administrator*, *Cloud Application Administrator*, or *Application
> Administrator*). A regular user cannot do this.

Click **Grant admin consent for `<your tenant>`** at the top of the
**API permissions** page, then confirm. The status of `WorkIQAgent.Ask`
should turn green ("Granted for `<tenant>`").

### (Optional, recommended) Lock down the redirect URIs

The redirect URI is already restricted to `http://localhost:3000/auth-callback`,
which is exactly what the dev server uses. If you change the port, update both
sides.

---

## Configuration

You can configure the app **two ways** — pick one.

### Option 1 — `.env.local` (recommended)

```ini
# .env.local  (git-ignored)
NEXT_PUBLIC_ENTRA_TENANT_ID=<tenant-guid-or-domain>
NEXT_PUBLIC_ENTRA_CLIENT_ID=<app-client-id-guid>
```

### Option 2 — `/settings` UI

Skip `.env.local`, start the app, open <http://localhost:3000/settings>, and
enter the same two values. They persist in `localStorage` on your machine
only.

> **Never** commit `.env.local`. The repo's `.gitignore` covers `.env`,
> `.env.local`, and `.env.*.local`.

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── proxy/route.ts      # Generic HTTP proxy (REST + A2A)
│   │   └── mcp/route.ts        # MCP proxy (JSON-RPC over Streamable HTTP)
│   ├── rest/page.tsx           # REST playground
│   ├── a2a/page.tsx            # A2A playground (Agent Card + JSON-RPC chat)
│   ├── mcp/page.tsx            # MCP playground (tool grid + invocation)
│   ├── settings/page.tsx       # Runtime tenant/client configuration
│   ├── auth-callback/page.tsx  # MSAL redirect handler
│   ├── layout.tsx
│   └── page.tsx                # Home
├── components/                 # TopNav, JsonViewer, MarkdownLite, AuthGate, …
└── lib/
    ├── workiq-config.ts        # Endpoints, scopes, permission GUIDs
    ├── auth.ts                 # MSAL wrappers
    ├── auth-context.tsx        # React context for auth state
    ├── workiq-client.ts        # React client for /api/proxy
    ├── mcp-client.ts           # React client for /api/mcp
    ├── mcp-tools.ts            # Static catalogue of MCP tools
    └── rest-methods.ts         # Catalogue of REST methods
```

**Auth flow.** Browser → MSAL `loginPopup` → access token for
`api://workiq.svc.cloud.microsoft/WorkIQAgent.Ask` → forwarded to the Next.js
proxy → proxy adds `Authorization: Bearer <token>` and forwards to the
Work IQ service → response streamed back to the page.

---

## Troubleshooting

| Symptom                                                              | Likely cause / fix                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MSAL popup closes with `AADSTS65001`                                 | Admin consent not granted. Re-run **Grant admin consent** in the app registration (needs Global Admin).                                                                                                                          |
| MSAL popup `AADSTS50011: reply URL mismatch`                         | Redirect URI in Entra ≠ `http://localhost:3000/auth-callback`. Recreate it under platform "Single-page application".                                                                                                            |
| `401 Unauthorized` from the proxy                                    | Token doesn't carry the `WorkIQAgent.Ask` scope. Verify the API permission is added **and** consented. Sign out and back in.                                                                                                    |
| `403` or `Work IQ is not enabled for this tenant`                    | Run the [Work IQ enablement guide](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/enable-work-iq).                                                                                                |
| The assistant reply shows raw JSON in the chat bubble                | Outdated build — pull latest, restart `npm run dev`. The `MarkdownLite` renderer auto-parses string bodies.                                                                                                                     |
| `npm run dev` fails on Windows with `EPERM` on `.next/`              | Stop any running dev server, delete `.next/`, re-run.                                                                                                                                                                           |
| No tools shown on `/mcp`                                             | `tools/list` returned empty — usually a tenant that doesn't yet have Work IQ MCP rolled out. Try again after a few minutes.                                                                                                     |

---

## Security & distribution notes

- **Local-only by design.** No SSL, no server-side session storage, no
  outbound logging. Do not expose this app on a public port.
- **Credentials hygiene.** `.env.local` is the only place real IDs live, and
  it is git-ignored. The settings UI stores values in `localStorage`, which
  is per-browser-profile and never sent to a backend.
- **Delegated-only.** Work IQ rejects app-only tokens. Every request to the
  service carries a delegated user token; the proxy never adds, caches, or
  rewrites tokens beyond forwarding.
- **No third-party telemetry.** The app does not call analytics, A/B, or
  feature-flag services.
- **No service principal secrets needed.** A SPA app registration has no
  client secret; consent is the only operator step.

---

## References

Official Microsoft Learn documentation for the Work IQ API:

- [Work IQ API overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/api-overview)
- [Enable Work IQ for your tenant](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/enable-work-iq)
- [REST API reference](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/rest/) — `POST /rest/conversations`, `POST /rest/conversations/{id}/chat`, `POST /rest/conversations/{id}/chatOverStream`
- [A2A overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/a2a/overview) — JSON-RPC `SendMessage` / `GetTask`
- [MCP overview](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/mcp/overview) and [MCP tool reference](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/mcp/tool-reference)
- [Permissions & scopes (`WorkIQAgent.Ask`)](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/permissions)

Related Microsoft Entra documentation:

- [Quickstart: register an SPA in Entra ID](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [Grant admin consent in the admin center](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/grant-admin-consent)

---

## License

MIT — see [LICENSE](./LICENSE).

This project is a community demonstrator. It is **not** an official Microsoft
product. "Microsoft", "Microsoft 365", "Entra", and "Work IQ" are trademarks
of the Microsoft group of companies.
