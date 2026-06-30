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
3. [Guided installation with Microsoft Scout](#guided-installation-with-microsoft-scout)
4. [Manual install (humans)](#manual-install-humans)
5. [Entra app registration (required)](#entra-app-registration-required)
6. [Configuration](#configuration)
7. [Security status — Next.js dependency](#security-status--nextjs-dependency)
8. [Architecture](#architecture)
9. [Troubleshooting](#troubleshooting)
10. [Security & distribution notes](#security--distribution-notes)
11. [References](#references)
12. [License](#license)

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

## Guided installation with Microsoft Scout

This project can be installed locally with **Microsoft Scout** or another AI
coding agent (GitHub Copilot Chat, Claude, Cursor, …). The agent should
guide you step by step and ask for confirmation **before** changing the
machine.

### Pre-flight questions the agent must confirm

Before any file is written or any package installed, the agent must ask and
confirm:

1. **Where should the repo be cloned?**
   - Default: the current workspace.
   - Example: `C:\Users\<user>\Documents\WorkIQ-API-Client`
2. **Can missing dependencies be installed?**
   - Required: **Node.js 20+**, **npm**, **git**.
   - If missing, the agent should ask before installing, or redirect you to
     the official installer.
3. **Which Microsoft Entra tenant should be used?**
   - Any tenant where Work IQ is enabled and where you can grant admin
     consent.
4. **Which account will create the app registration?**
   - The account needs **Global Administrator** rights (or *Privileged Role
     Admin* / *Cloud Application Admin*) to grant admin consent for the
     delegated `WorkIQAgent.Ask` permission.
5. **Should the app read configuration from `.env.local` or `/settings`?**
   - Recommended: `.env.local` for a repeatable setup.
   - Alternative: `/settings` UI for quick, throwaway demos.

### Scout prompt

Paste this into Microsoft Scout (or any AI coding agent):

```text
Install the Work IQ API Demonstrator locally from:
https://github.com/timoleo23/WorkIQ-API-Client

Guide me step by step.

Before making changes, ask me to confirm:
1. The local folder where the repo should be cloned.
2. Whether you may install missing dependencies such as Node.js, npm, or git.
3. Which Microsoft Entra tenant to use.
4. Which account will be used for the Entra app registration.

App registration requirements:
- Platform: Single-page application
- Redirect URI: http://localhost:3000/auth-callback
- Delegated API permission: WorkIQAgent.Ask
  (API "Work IQ", App ID 0b1715fd-f4bf-4c63-b16d-5be31f9847c2)
- Grant admin consent for the tenant.

Then:
1. Clone the repo.
2. Run npm install.
3. Copy .env.example to .env.local.
4. Fill NEXT_PUBLIC_ENTRA_TENANT_ID and NEXT_PUBLIC_ENTRA_CLIENT_ID.
5. Run npm run build.
6. Run npm run dev.
7. Open http://localhost:3000.
8. Verify the /rest page with a first Work IQ question.

Do not commit .env.local.
Do not change the redirect URI unless I explicitly ask.
```

### Step-by-step install flow (PowerShell)

```powershell
git clone https://github.com/timoleo23/WorkIQ-API-Client.git
cd WorkIQ-API-Client
npm install
Copy-Item .env.example .env.local
npm run build
npm run dev
```

Then either edit `.env.local` directly, or open
<http://localhost:3000/settings> and configure:

```ini
NEXT_PUBLIC_ENTRA_TENANT_ID=<tenant-id-or-domain>
NEXT_PUBLIC_ENTRA_CLIENT_ID=<entra-app-client-id>
```

### Entra app registration checklist

1. Open <https://entra.microsoft.com>
2. Go to **App registrations** → **New registration**
3. Use:
   - Name: `Work IQ API Demonstrator (local)`
   - Supported account types: `Accounts in this organizational directory only`
   - Platform: `Single-page application`
   - Redirect URI: `http://localhost:3000/auth-callback`
4. Copy:
   - **Application (client) ID** → `NEXT_PUBLIC_ENTRA_CLIENT_ID`
   - **Directory (tenant) ID** → `NEXT_PUBLIC_ENTRA_TENANT_ID`
5. Go to **API permissions** → **Add a permission**
6. Add:
   - API: **Work IQ** (App ID `0b1715fd-f4bf-4c63-b16d-5be31f9847c2`)
   - Delegated permission: **`WorkIQAgent.Ask`**
7. Click **Grant admin consent** (requires Global Admin)
8. Sign in to the local app with a user from the same tenant who has the
   Microsoft 365 data Work IQ should reason over.

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

## Security status — Next.js dependency

Earlier revisions of this repo pinned `next@14.2.18`, which is flagged by
`npm audit` for known vulnerabilities. The current `package.json` and lockfile
are pinned to the safest tested version on the Next 14 line:

```json
"next": "14.2.35"
```

This avoids an unplanned major migration while keeping the local demonstrator
on a known Next 14 build. However, as of 2026-06-30, `npm audit` still reports
Next.js advisories against the Next 14 line and proposes a breaking upgrade to
Next 16. Treat a clean public release as requiring a dedicated Next 16 migration
and validation pass.

If you cloned an older copy of this repo, apply the patch:

```powershell
npm install next@14.2.35
npm audit
npm run build
```

If `npm audit` still reports Next.js advisories, do not use `npm audit fix --force`
blindly. Plan and test the Next major-version migration instead.

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
| `npm audit` reports `next@14.2.x` is vulnerable                      | See [Security status — Next.js dependency](#security-status--nextjs-dependency). A fully clean audit currently requires a tested Next major-version migration.                                                                     |
| `next dev` fails with a Tailwind error or `NODE_ENV` warning         | `NODE_ENV` is set to a non-standard value. See [`next dev` fails with Tailwind or `NODE_ENV` warning](#next-dev-fails-with-tailwind-or-node_env-warning) below.                                                                  |

#### `next dev` fails with Tailwind or `NODE_ENV` warning

Make sure `NODE_ENV` is **not** set to a non-standard value (Next.js expects
`development`, `production`, or `test`).

PowerShell:

```powershell
Remove-Item Env:\NODE_ENV -ErrorAction SilentlyContinue
npm run dev
```

If `next dev` still fails, fall back to a local production server:

```powershell
npm run build
$env:NODE_ENV = "production"
npm run start
```

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
- **Proxy hardening.** The server proxy uses a server-only `WORKIQ_BASE_URL`,
  validates that it is an HTTPS origin, only forwards allowlisted request
  headers, and only returns allowlisted upstream response headers to the UI.
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
