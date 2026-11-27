# YMS AI — Test Status (Observed Only)

**Environment note:** Tests below were run in the **agent sandbox**, not proven on Replit (`REPL_ID` unset).

---

## 1. Tests executed successfully (observed)

**Command:**

```bash
node --experimental-strip-types --test \
  scripts/src/zero-cost-ai-harness.ts \
  scripts/src/image-auth-harness.ts
```

**Result:** `tests 11 | pass 11 | fail 0`

### P3-related (image-auth-harness)

| Test | Result |
|------|--------|
| Unauthenticated generate-image → 401, no provider call | PASS |
| Unauthenticated anime → 401, no provider call | PASS |
| Authenticated generate-image; empty prompt → 400 | PASS |
| Authenticated anime; missing imageBase64 → 400 | PASS |
| Production sources: `requireUserId` before provider | PASS |

### P4-related (zero-cost-ai-harness)

| Test | Result |
|------|--------|
| Default env blocks AI | PASS |
| `YMS_AI_PROVIDER=openai` still blocked | PASS |
| free-local without base URL blocked | PASS |
| free-local with base URL still blocked (no client) | PASS |
| Production sources: zero-cost gate before provider | PASS |
| No fabricated success payload when blocked | PASS |

**Also observed:** importing `evaluateZeroCostAi()` yields  
`allowed: false`, `status: 503`, `code: AI_UNAVAILABLE_ZERO_COST`.

---

## 2. Tests not reliably green in agent environment

| Test | Outcome | Reason |
|------|---------|--------|
| `scripts/src/health-harness.ts` via bare `node` | Fail / missing module | Needs `express` resolution from workspace install |
| `lib/sandbox/src/sandbox.test.ts` via bare `node` | Fail | ESM `.js` import paths need tsx/workspace loader |
| Full `pnpm run typecheck` | Not completed in final sessions | pnpm/registry failures or incomplete node_modules |
| Full `pnpm run build` | Not completed in final sessions | Same |
| Live `GET /api/healthz` on running api-server | Not completed against full app | App import needs installed deps + PORT |
| Real Clerk login E2E | Not run | No secrets / not Replit |
| Real OpenAI/image calls | **Intentionally not run** | Zero-cost policy |

---

## 3. Earlier sessions (historical, not re-proven here)

- Sandbox S1: 14 unit tests reported pass under `/tmp` + tsx (prior phase).  
- Health harness: reported pass under `/tmp` with express (prior phase).  
- Baseline typecheck/build: reported pass under `/tmp/yms-ai-baseline` with `PORT`/`BASE_PATH` (early phase).  

These are **not** re-attested in the handoff moment if not re-run.

---

## 4. Security / policy checks (code inspection)

| Check | Status |
|-------|--------|
| Image/anime use `requireUserId` | Present in source |
| Chat send uses zero-cost gate before `openai.chat` | Present |
| Sandbox executor mode disabled | Present |
| No `.env` in source package | Confirmed for ZIP packaging |

---

## 5. Implications for Code Studio Pro

- Trust **P3/P4 unit harnesses** as regression tests to port or re-run.  
- Do **not** assume production readiness on Replit without CSP/Replit-side verification.  
- Any merge CI should include: auth 401 tests, zero-cost 503 tests, healthz 200 without AI secrets.
