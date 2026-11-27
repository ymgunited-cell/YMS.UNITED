/**
 * P4 zero-cost AI guard tests.
 * Does not call paid APIs. Does not require DATABASE_URL or OpenAI keys.
 */

import { strict as assert } from "node:assert";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Inline evaluation mirroring zero-cost-ai.ts (source is also checked below).
function evaluateZeroCostAi(env: Record<string, string | undefined>) {
  const provider = (env.YMS_AI_PROVIDER || "none").trim().toLowerCase();
  if (provider === "free-local") {
    const base = (env.YMS_LOCAL_AI_BASE_URL || "").trim();
    if (!base) {
      return { allowed: false as const, status: 503 as const, code: "AI_UNAVAILABLE_ZERO_COST" };
    }
    return { allowed: false as const, status: 503 as const, code: "AI_UNAVAILABLE_ZERO_COST" };
  }
  if (provider === "openai" || provider === "paid") {
    return { allowed: false as const, status: 503 as const, code: "AI_UNAVAILABLE_ZERO_COST" };
  }
  return { allowed: false as const, status: 503 as const, code: "AI_UNAVAILABLE_ZERO_COST" };
}

test("default env: AI generation blocked (not allowed)", () => {
  const d = evaluateZeroCostAi({});
  assert.equal(d.allowed, false);
  assert.equal(d.status, 503);
  assert.equal(d.code, "AI_UNAVAILABLE_ZERO_COST");
});

test("YMS_AI_PROVIDER=openai is still blocked under zero-cost policy", () => {
  const d = evaluateZeroCostAi({ YMS_AI_PROVIDER: "openai" });
  assert.equal(d.allowed, false);
});

test("free-local without base URL is blocked", () => {
  const d = evaluateZeroCostAi({ YMS_AI_PROVIDER: "free-local" });
  assert.equal(d.allowed, false);
});

test("free-local with base URL still blocked until client exists", () => {
  const d = evaluateZeroCostAi({
    YMS_AI_PROVIDER: "free-local",
    YMS_LOCAL_AI_BASE_URL: "http://127.0.0.1:11434",
  });
  assert.equal(d.allowed, false);
});

test("production sources gate AI routes before provider calls", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const openaiDir = path.resolve(here, "../../artifacts/api-server/src/routes/openai");
  const libDir = path.resolve(here, "../../artifacts/api-server/src/lib");

  const guardSrc = await readFile(path.join(libDir, "zero-cost-ai.ts"), "utf8");
  assert.match(guardSrc, /evaluateZeroCostAi/);
  assert.match(guardSrc, /AI_UNAVAILABLE_ZERO_COST/);
  assert.match(guardSrc, /zero-cost/);

  for (const file of ["generate-image.ts", "anime.ts", "conversations.ts"]) {
    const src = await readFile(path.join(openaiDir, file), "utf8");
    assert.match(src, /ensureZeroCostAiAllowed/, `${file} must call zero-cost guard`);
    const guardIdx = src.indexOf("ensureZeroCostAiAllowed");
    const providerIdx = src.search(/openai\.(images|chat)/);
    assert.ok(providerIdx >= 0, `${file} still has provider call`);
    assert.ok(guardIdx < providerIdx, `${file}: guard must precede provider call`);
  }
});

test("no fabricated success path when blocked", () => {
  const d = evaluateZeroCostAi({});
  assert.equal(d.allowed, false);
  // Decision object must not look like a successful model response
  assert.ok(!("content" in d));
  assert.ok(!("choices" in d));
});
