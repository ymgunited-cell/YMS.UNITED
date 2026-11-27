# YMS AI Standalone — HANDOVER (Pre-integration)

**Source:** Attachment `YMS_AI_HANDOFF_COMPLETE.zip` (2026-10-26) containing nested `YMS_AI_SOURCE.zip` + handoff markdowns.

## What this is

Standalone **YMS AI** monorepo as recovered before/alongside Code Studio Pro integration work:

- Chat-first React app (`artifacts/yms-ai`)
- Express API (`artifacts/api-server`)
- OpenAI integration packages + **zero-cost gate** (P4)
- Clerk auth, Drizzle/Postgres conversations
- Sandbox package with **execution disabled**
- Scripts for health/auth/zero-cost harnesses

## Handoff docs included

- `YMS_AI_COMPLETE_HANDOFF.md`
- `YMS_AI_FILE_INVENTORY.md`
- `YMS_AI_MERGE_GUIDE.md`
- `YMS_AI_TEST_STATUS.md`

## Important

- Not proven to be the live Replit production copy (handoff itself states this).
- Broader “Primary Brain / multi-agent platform” was largely **specification**, not full runtime in this tree.
- Integration into Code Studio Pro happened in later CSP sessions; integrated CSP sources are **not** in this package.

## Next task

`pnpm install` → run documented harness tests → verify zero-cost default deny → optional live free-local provider only.
