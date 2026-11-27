/**
 * Command policy — deny by default.
 * S1 defines the policy engine only; it does not execute commands.
 */

export type PolicyDecision = "ALLOWED" | "DENIED";

export interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
}

/** Base command names that may be allowed later under isolation (not activated in S1). */
const FUTURE_ALLOWLIST = new Set([
  "node",
  "python3",
  "python",
]);

/** Explicitly dangerous patterns — always denied. */
const DENY_PATTERNS: RegExp[] = [
  /^\s*$/,
  /[;&|`$]/, // shell metacharacters in argv elements
  /\brm\b/i,
  /\bsudo\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bnc\b/i,
  /\bncat\b/i,
  /\bssh\b/i,
  /\bdocker\b/i,
  /\bpodman\b/i,
  /\bmount\b/i,
  /\bumount\b/i,
  /\bmkfs\b/i,
  /\bdd\b/i,
];

/**
 * Evaluate argv against deny-by-default policy.
 * - Empty argv → DENIED
 * - Any shell metacharacter in any element → DENIED
 * - Known dangerous tools → DENIED
 * - Even allowlisted base commands are DENIED in S1 with reason that
 *   isolated execution is not enabled (defense in depth).
 */
export function evaluateCommandPolicy(argv: string[]): PolicyResult {
  if (!argv || argv.length === 0) {
    return { decision: "DENIED", reason: "empty argv" };
  }

  for (const part of argv) {
    if (typeof part !== "string") {
      return { decision: "DENIED", reason: "non-string argv element" };
    }
    for (const re of DENY_PATTERNS) {
      if (re.test(part)) {
        return {
          decision: "DENIED",
          reason: `denied by pattern ${re}: ${part}`,
        };
      }
    }
  }

  const base = pathBase(argv[0]);
  if (FUTURE_ALLOWLIST.has(base)) {
    // S1: even known interpreters are refused until an isolated executor is enabled.
    return {
      decision: "DENIED",
      reason:
        "S1: isolated executor not enabled; command refused by policy (deny-by-default)",
    };
  }

  return {
    decision: "DENIED",
    reason: `command not in allowlist: ${base}`,
  };
}

function pathBase(cmd: string): string {
  const normalized = cmd.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}
