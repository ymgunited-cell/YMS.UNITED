# YMS AI × Code Studio Pro — Merge Guide (Planning Only)

**Status:** Design guidance for a separate conversation. **Do not execute the merge from this file alone.**

---

## 1. Goals

- Keep **Code Studio Pro** as the primary UX shell (layout, editor, compiler, preview, its chat patterns).
- Import **selected capabilities** from YMS AI—not a blind repo overlay.
- **Zero paid APIs** unless the owner explicitly changes policy later.
- **No unsafe sandbox** execution.
- **No fake AI success** when no free provider is configured.

---

## 2. What YMS AI actually offers worth taking

| Capability | YMS location | Merge posture |
|------------|--------------|---------------|
| Conversation persistence model | `lib/db` schema + conversation routes | Optional module; map to CSP user ids |
| Clerk-style route guards | `require-user.ts`, conversations auth | Align with CSP auth—do not run two conflicting auth systems |
| Zero-cost AI gate | `zero-cost-ai.ts` | **Reuse the policy idea** in CSP before any provider call |
| Streaming chat handler patterns | `conversations.ts` | Adapt to CSP chat API; strip paid model defaults until free provider exists |
| OpenAPI + Zod + Orval pipeline | `lib/api-spec`, `api-zod`, `api-client-react` | Only if CSP lacks a contract pipeline |
| Disabled sandbox package | `lib/sandbox` | Copy only if CSP needs a future execution interface; keep disabled |
| Image/anime routes | generate-image / anime | Optional; still billable upstream—keep behind zero-cost + auth |

**Do not** copy wholesale:

- Entire `artifacts/yms-ai` marketing UI if CSP UI must remain
- Duplicate `lib/integrations/openai_ai_integrations` + `integrations-openai-ai-server` without deduping
- Replit-only assumptions without CSP host mapping

---

## 3. What must be inspected in Code Studio Pro first

Before any file copy, inventory CSP for:

1. **Auth:** Clerk, custom JWT, session cookies, or none?  
2. **Backend:** Express, Next.js API routes, other?  
3. **DB:** existing schema for users/projects/files/chat?  
4. **Chat:** already streaming? which provider abstraction?  
5. **Editor/compiler/preview:** entrypoints and APIs that must not break  
6. **Package manager / monorepo:** npm vs pnpm vs other  
7. **Route prefix map:** avoid `/api` collisions  
8. **Env var names** already used  

If CSP structure is unknown, **stop and inventory**—do not assume YMS layout.

---

## 4. Recommended integration architecture

```
[ Code Studio Pro UI — unchanged chrome ]
        │
        ├─ Editor / Compiler / Preview (CSP native)
        │
        └─ AI assistant panel
                │
                ▼
        [ CSP API gateway ]
                │
                ├─ Auth middleware (single system)
                ├─ zero-cost gate (from YMS policy)
                ├─ Provider adapter (free-local only until verified)
                └─ Optional: conversation store (YMS schema ideas)
```

**Hard rules:**

- One auth system in production.  
- One chat persistence model (migrate or map—not two silent stores).  
- Provider adapter returns **explicit errors** when unavailable—never invented completions.  
- Sandbox remains **disabled** until isolation is proven on CSP’s host.

---

## 5. Conflict avoidance checklist

| Risk | Mitigation |
|------|------------|
| Competing `/api/openai` routes | Namespace e.g. `/api/yms/*` or adopt CSP paths only |
| Two Clerk middlewares | Single middleware chain |
| pnpm vs npm lockfiles | Choose one package manager for the merged root |
| Drizzle schema clash | Separate schema namespace or shared explicit migration plan |
| Import-time OpenAI/DB throws | Lazy init (YMS P5 pattern) so health/editor work without AI secrets |
| Paid model default | Remove or gate; default deny |

---

## 6. Zero-cost constraint

- Do not enable OpenAI (or any paid API) as the default path.  
- Free local providers (e.g. Ollama) only after **verified** install on the target host.  
- Until then, AI features respond with a clear “unavailable” state (YMS: `AI_UNAVAILABLE_ZERO_COST`).

---

## 7. Suggested phased merge (after owner approval)

1. **Inventory CSP** (auth, API, DB, chat, scripts).  
2. **Port zero-cost gate + error contract** into CSP API.  
3. **Optional:** conversation tables / user isolation patterns from YMS.  
4. **Optional:** streaming handler adapted to free provider adapter.  
5. **Do not** port image/anime until free vision/image stack exists.  
6. **Regression:** CSP editor, compile, preview, login still pass.  
7. **No** autonomous self-modification of production code.

---

## 8. Out of scope for first merge

- Training/fine-tuning models  
- Enabling `DisabledSandboxExecutor`  
- Replacing CSP UI with YMS Home/Chat chrome  
- Replit Autoscale-specific ops unless CSP also runs there  

---

## 9. Inputs to request from the CSP conversation

- Tree listing of CSP top-level packages  
- Auth middleware file paths  
- Existing chat API routes  
- DB schema or ORM configs  
- Confirmation of zero-cost policy on that project  
