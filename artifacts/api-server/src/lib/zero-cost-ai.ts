/**
 * Zero-cost AI gate for YMS AI.
 *
 * Billable cloud providers (e.g. OpenAI via AI_INTEGRATIONS_*) must not run
 * unless an explicitly approved zero-cost provider is configured and verified.
 *
 * Default: blocked. No free-tier assumption. No fabricated model output.
 *
 * To enable a future free local provider (after verification), set:
 *   YMS_AI_PROVIDER=free-local
 *   YMS_LOCAL_AI_BASE_URL=http://...
 * and implement a real local client. Until then, all AI generation stays blocked.
 */

export type ZeroCostDecision =
  | { allowed: true; provider: "free-local" }
  | { allowed: false; status: 503; error: string; code: "AI_UNAVAILABLE_ZERO_COST" };

/**
 * Returns whether AI generation is allowed under the zero-cost policy.
 * Does not perform network calls. Does not read secret values into logs.
 */
export function evaluateZeroCostAi(): ZeroCostDecision {
  const provider = (process.env.YMS_AI_PROVIDER || "none").trim().toLowerCase();

  // Reserved path for a verified local/free provider — not active until
  // base URL is set AND a real integration exists. Still does not enable OpenAI.
  if (provider === "free-local") {
    const base = (process.env.YMS_LOCAL_AI_BASE_URL || "").trim();
    if (!base) {
      return {
        allowed: false,
        status: 503,
        error:
          "AI features are unavailable: YMS_AI_PROVIDER=free-local is set but YMS_LOCAL_AI_BASE_URL is missing.",
        code: "AI_UNAVAILABLE_ZERO_COST",
      };
    }
    // No local client is wired in this codebase yet — fail closed.
    return {
      allowed: false,
      status: 503,
      error:
        "AI features are unavailable: free-local provider is selected but no local AI client is configured in this build.",
      code: "AI_UNAVAILABLE_ZERO_COST",
    };
  }

  // Explicit paid OpenAI is never treated as zero-cost.
  if (provider === "openai" || provider === "paid") {
    return {
      allowed: false,
      status: 503,
      error:
        "AI features are unavailable under the zero-cost policy. Paid providers are not enabled.",
      code: "AI_UNAVAILABLE_ZERO_COST",
    };
  }

  return {
    allowed: false,
    status: 503,
    error:
      "AI features are unavailable: no zero-cost AI provider is configured. Set up a verified free local provider before enabling AI responses.",
    code: "AI_UNAVAILABLE_ZERO_COST",
  };
}

/**
 * Express-friendly helper: if AI is blocked, writes JSON 503 and returns false.
 */
export function ensureZeroCostAiAllowed(res: {
  status: (code: number) => { json: (body: unknown) => void };
}): boolean {
  const decision = evaluateZeroCostAi();
  if (decision.allowed) return true;
  res.status(decision.status).json({
    error: decision.error,
    code: decision.code,
  });
  return false;
}
