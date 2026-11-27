# YMS AI — Complete Technical Handoff

**Handoff date:** 2026-10-26  
**Purpose:** Transfer accurate knowledge of the current YMS AI codebase into another conversation (Code Studio Pro integration planning). **Do not merge projects based on this document alone.**

---

## 0. Source of truth (critical)

| Item | Value |
|------|--------|
| Inspected path | `/home/workdir/artifacts/yms-ai-source` |
| Package produced | `/home/workdir/artifacts/yms-ai-handoff/YMS_AI_SOURCE.zip` |
| Is this proven to be the live Replit deployment copy? | **No.** Environment variables `REPL_ID` / `REPL_SLUG` were unset during all agent sessions. This is the working tree the agent could access. |
| Older zip named like «احدث نموذج» | **Must not** be preferred over this tree if both exist. |
| Secrets in tree | No `.env` files found; do not invent credentials. |

Treat this handoff as: **latest agent-accessible source + documented agent-phase changes (P3–P5)**, not as a certificate of production Replit parity.

---

## 1. Project idea and goals

**YMS AI** is a monorepo product branded as a general-purpose AI assistant (chat-first), with:

- Authenticated chat / conversation persistence
- OpenAI-oriented streaming chat (model id in code: `gpt-5.1`)
- Image generation and “anime conversion” endpoints
- Clerk authentication
- PostgreSQL + Drizzle for conversations/messages
- Target hosting: **Replit** (`.replit` → `deploymentTarget = "autoscale"`)

**Owner non-negotiables (from project phases):**

- Prefer **zero monetary cost** for AI calls (P4 blocks billable providers by default)
- Do not run untrusted generated code without real isolation (`DisabledSandboxExecutor`)
- Preserve existing UI; do not replace with another product’s UI when integrating
- No fabricated AI answers when the provider is unavailable

A broader “orchestration platform” (Primary Brain, workforce, sandbox execution) appears in specification discussions but is **not** implemented as a full runtime in this tree—only a disabled sandbox package and chat/image features exist in code.

---

## 2. Repository structure (high level)

```
yms-ai-source/
├── package.json              # workspace scripts: typecheck, build
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json / tsconfig.json
├── .replit / replit.md
├── artifacts/
│   ├── yms-ai/               # React + Vite frontend
│   ├── api-server/           # Express API
│   └── mockup-sandbox/       # UI kit preview app (NOT a code execution sandbox)
├── lib/
│   ├── db/                   # Drizzle + Postgres schema
│   ├── api-spec/             # OpenAPI + Orval codegen config
│   ├── api-zod/              # Generated Zod types
│   ├── api-client-react/     # Generated React Query client
│   ├── integrations-openai-ai-server/
│   ├── integrations-openai-ai-react/
│   ├── integrations/openai_ai_integrations/  # parallel/legacy integration copy
│   └── sandbox/              # S1 interfaces; execution DISABLED
└── scripts/                  # health / auth / zero-cost harness tests
```

---

## 3. Tech stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces |
| Language | TypeScript ~5.9 |
| Runtime | Node.js 24 (per `.replit` / replit.md) |
| Frontend | React, Vite, Tailwind, shadcn/ui (Radix), TanStack Query, Wouter, Framer Motion |
| Auth | Clerk (`@clerk/express`, frontend Clerk components) |
| API | Express 5 |
| DB | PostgreSQL, Drizzle ORM |
| Validation | Zod (api-zod generated from OpenAPI) |
| AI integration | OpenAI SDK via `AI_INTEGRATIONS_OPENAI_*` env vars |
| Build (API) | esbuild (`artifacts/api-server/build.mjs`) |
| Hosting target | Replit Autoscale |

---

## 4. Frontend

**Package:** `artifacts/yms-ai` (`@workspace/yms-ai`)

**Important app files:**

- `src/App.tsx` — routing/shell
- `src/pages/Home.tsx` — marketing/landing
- `src/pages/Chat.tsx` — main chat UX (streaming, abort)
- `src/pages/*` — additional pages as present in tree
- `src/components/ui/*` — large shadcn component set

**UX (from code intent):**

- Land on branded home; chat requires auth
- Chat streams assistant tokens via SSE-style consumption of API
- Image/anime features exist on the API side; UI wiring must be re-verified in Chat/Home

**In code vs tested:** Frontend build/runtime on Replit was **not** verified in agent environment.

---

## 5. API server and routes

**Package:** `artifacts/api-server`

| Path | Auth | Zero-cost gate | Behavior |
|------|------|----------------|----------|
| `GET /api/healthz` | No | No | `{ status: "ok" }` via Zod `HealthCheckResponse` |
| OpenAI conversation CRUD + messages | `getAuth` → 401 | On **send message** before model call | DB-backed; streams chat completion |
| `POST /api/openai/generate-image` | `requireUserId` | Yes | `gpt-image-1` image generate |
| `POST /api/openai/anime` | `requireUserId` | Yes | vision describe + image generate |

**P5 change:** `routes/index.ts` **lazy-loads** `./openai` so importing the app for health does not require DB/AI modules at startup. If load fails → `503 ROUTES_UNAVAILABLE`.

**Entry:** `src/index.ts` requires `PORT`.  
**App:** `src/app.ts` — cors, json 20mb, `clerkMiddleware`, mounts `/api`.

---

## 6. Conversations and storage

**Schema (Drizzle):**

- `conversations`: id, userId, title, timestamps (see `lib/db/src/schema/conversations.ts`)
- `messages`: id, conversationId, role, content, timestamps (`messages.ts`)

**Isolation:** queries filter by `conversations.userId` matching Clerk `userId`.

**Import-time hard dependency:** `lib/db/src/index.ts` throws if `DATABASE_URL` missing.

---

## 7. Authentication and permissions

- Clerk middleware on API
- Pattern: `const { userId } = getAuth(req); if (!userId) return 401`
- Shared helper: `artifacts/api-server/src/routes/openai/require-user.ts`
- Special-case admin email check in `conversations.ts` for “creator mode” system prompt (email constant in source)
- Image/anime were unprotected until **P3**; now use `requireUserId`

**Not verified live:** end-to-end login against real Clerk keys.

---

## 8. AI providers and zero-cost policy (P4)

**Configured integration (code):** OpenAI-compatible client:

- Env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Throws at **import** of `lib/integrations-openai-ai-server/src/client.ts` if missing

**Runtime gate:** `artifacts/api-server/src/lib/zero-cost-ai.ts`

- Default: **block** all generation with `503` + `code: AI_UNAVAILABLE_ZERO_COST`
- `YMS_AI_PROVIDER=openai|paid` still blocked under zero-cost policy
- `free-local` reserved but **not wired** to a client → still blocked

**No Ollama / local runtime** was found in the agent environment.

**Do not** tell users that AI “works” unless a verified free provider is integrated and the gate allows it.

---

## 9. Code generation, images, extras

| Feature | Status in code | Tested with real provider? |
|---------|----------------|----------------------------|
| Chat streaming | Yes | **No** (blocked / no keys in agent env) |
| Image generation | Yes | **No** |
| Anime conversion | Yes | **No** |
| Sandbox code execution | Package only; **disabled** | Unit tests for policy/paths only |
| mockup-sandbox | UI preview app | Name is misleading—not OS isolation |

---

## 10. Build, run, tests, environment

**Commands (from root):**

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-server run dev   # needs PORT + secrets
```

**Scripts package tests:**

```bash
pnpm --filter @workspace/scripts run test:health
pnpm --filter @workspace/scripts run test:image-auth
pnpm --filter @workspace/scripts run test:zero-cost
```

**Env (names only — never commit values):**

- `PORT`, `BASE_PATH` (frontend/Replit patterns)
- `DATABASE_URL`
- `CLERK_PUBLISHABLE_KEY`, Clerk secret keys as required by Clerk setup
- `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` (billable path; blocked by P4 gate unless policy changes)
- Optional future: `YMS_AI_PROVIDER`, `YMS_LOCAL_AI_BASE_URL`

---

## 11. Agent phases applied to this tree

| Phase | What landed in source |
|-------|------------------------|
| S1 sandbox | `lib/sandbox` + `DisabledSandboxExecutor` |
| Health harness | `scripts/src/health-harness.ts` |
| P3 | `require-user.ts`; auth on generate-image + anime; `image-auth-harness.ts` |
| P4 | `zero-cost-ai.ts`; gates on conversations send + image + anime; `zero-cost-ai-harness.ts` |
| P5 | Lazy openai router in `routes/index.ts` |
| P6 | Verification only; **not on Replit** — no file changes |

---

## 12. Known gaps

1. Full server start needs DB + Clerk; AI answers need free provider (none wired).
2. Agent never confirmed Replit production parity.
3. `pnpm`/full typecheck/build often unavailable in agent sandbox network.
4. OpenAI client import-time throw still couples route modules to keys when openai package loads.
5. Image/anime still no rate limiting.
6. Self-improvement / Primary Brain / workforce: **not implemented**.
7. Sandbox execution: **must stay disabled** until real isolation exists.

---

## Distinction legend for integrators

- **In code:** present in this ZIP/tree  
- **Agent-tested:** P3/P4 harnesses (11 tests) passed under `node --experimental-strip-types`  
- **Production-verified on Replit:** **not claimed**
