# YMS AI — File Inventory

Source root inspected: `yms-ai-source/` (packaged as `YMS_AI_SOURCE.zip`).

Legend: **R** = required for full app, **O** = optional/dev, **T** = test, **C** = config (preserve), **S** = security-sensitive integration

---

## Root

| Path | Role | Depends on | Flags |
|------|------|------------|-------|
| `package.json` | Workspace scripts typecheck/build | pnpm workspaces | R, C |
| `pnpm-workspace.yaml` | Package globs | — | R, C |
| `pnpm-lock.yaml` | Locked deps | pnpm | R, C |
| `tsconfig.base.json` | Shared TS | — | R, C |
| `tsconfig.json` | Root references | base | R |
| `.replit` | Replit modules, ports, autoscale | Replit | C |
| `replit.md` | Human stack notes | — | O |
| `README_EXPORT.txt` | Export setup notes | — | O |
| `.gitignore` / `.npmrc` / `.replitignore` | Tooling ignores | — | C |

---

## API server (`artifacts/api-server/`)

| Path | Role | Depends on | Flags |
|------|------|------------|-------|
| `src/index.ts` | Listen on `PORT` | `app.ts` | R |
| `src/app.ts` | Express app, Clerk, `/api` | routes, middlewares | R, S |
| `src/routes/index.ts` | Health + **lazy** openai gate | health, dynamic `./openai` | R |
| `src/routes/health.ts` | `GET /healthz` | `@workspace/api-zod` | R |
| `src/routes/openai/index.ts` | Mount conversation/image/anime | child routers | R |
| `src/routes/openai/conversations.ts` | Chat CRUD + stream | db, clerk, openai, zero-cost | R, S |
| `src/routes/openai/generate-image.ts` | Image gen | require-user, zero-cost, openai | R, S |
| `src/routes/openai/anime.ts` | Anime pipeline | same | R, S |
| `src/routes/openai/require-user.ts` | Clerk 401 helper | `@clerk/express` | R, S |
| `src/lib/zero-cost-ai.ts` | Blocks billable AI by policy | env `YMS_AI_*` | R, S |
| `src/lib/logger.ts` | Pino logger | pino | R |
| `src/middlewares/clerkProxyMiddleware.ts` | Clerk proxy (prod) | env Clerk | O, S |
| `build.mjs` | esbuild bundle | — | R, C |
| `package.json` | api-server deps | workspace packages | R, C |

---

## Frontend (`artifacts/yms-ai/`)

| Path | Role | Flags |
|------|------|-------|
| `src/App.tsx` | App routes/shell | R |
| `src/pages/Chat.tsx` | Chat UI / streaming client | R |
| `src/pages/Home.tsx` | Landing | R |
| `src/main.tsx` / `index.html` | Bootstrap | R |
| `src/components/ui/*` | shadcn primitives | R |
| `vite.config.ts` | Vite + Replit plugins | R, C |
| `package.json` | Frontend deps | R, C |

---

## Database (`lib/db/`)

| Path | Role | Flags |
|------|------|-------|
| `src/index.ts` | Pool + drizzle; **throws without DATABASE_URL** | R, S |
| `src/schema/conversations.ts` | Conversations table | R |
| `src/schema/messages.ts` | Messages table | R |
| `src/schema/index.ts` | Schema export | R |
| `drizzle.config.ts` | Drizzle kit | C |

---

## API contract & clients

| Path | Role | Flags |
|------|------|-------|
| `lib/api-spec/openapi.yaml` | Source of truth for HTTP API | R, C |
| `lib/api-spec/orval.config.ts` | Codegen config | C |
| `lib/api-zod/src/**` | Zod schemas / types | R |
| `lib/api-client-react/src/**` | React Query hooks + fetch | R |

---

## OpenAI integrations

| Path | Role | Flags |
|------|------|-------|
| `lib/integrations-openai-ai-server/src/client.ts` | OpenAI client; import-time env check | R, S |
| `.../image/client.ts` | Image helpers | O, S |
| `.../audio/client.ts` | Audio/ffmpeg spawn | O, S |
| `lib/integrations-openai-ai-react/**` | Client hooks for audio/voice | O |
| `lib/integrations/openai_ai_integrations/**` | Parallel copy of integration | O — avoid dual maintenance on merge |

---

## Sandbox (`lib/sandbox/`)

| Path | Role | Flags |
|------|------|-------|
| `src/executor.ts` | **DisabledSandboxExecutor only** | R (keep disabled) |
| `src/paths.ts` / `policy.ts` / `workspace.ts` | Safety helpers | O |
| `src/sandbox.test.ts` | Unit tests | T |

**Related but different:** `artifacts/mockup-sandbox/` — frontend component playground, **not** execution isolation.

---

## Scripts / tests

| Path | Role | Flags |
|------|------|-------|
| `scripts/src/health-harness.ts` | Isolated `/api/healthz` test | T |
| `scripts/src/image-auth-harness.ts` | P3 auth behavior tests | T |
| `scripts/src/zero-cost-ai-harness.ts` | P4 gate tests | T |
| `scripts/package.json` | `test:health`, `test:image-auth`, `test:zero-cost` | T |

---

## Merge-critical preservation list

Must not be dropped casually when integrating:

1. `require-user.ts` + auth on image/anime  
2. `zero-cost-ai.ts` + call sites  
3. Lazy `routes/index.ts` health separation  
4. `lib/db` schema + userId filters  
5. Clerk middleware wiring in `app.ts`  
6. `DisabledSandboxExecutor` default  
7. `pnpm-lock.yaml` / workspace layout  
