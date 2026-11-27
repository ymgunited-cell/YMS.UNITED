/**
 * Executor layer for S1.
 *
 * DisabledSandboxExecutor — always refuses execution.
 * This is the only executor activated in S1.
 *
 * A future IsolatedSandboxExecutor may use OS primitives (namespaces, etc.)
 * after isolation is proven on the target deployment environment.
 * It is intentionally not implemented here so untrusted code cannot run
 * inside the YMS server process under a false sense of security.
 */

import type {
  SandboxExecutor,
  SandboxTaskSpec,
  SandboxRunResult,
  ExecutorMode,
} from "./types.js";
import { DEFAULT_LIMITS } from "./types.js";
import { evaluateCommandPolicy } from "./policy.js";

export class DisabledSandboxExecutor implements SandboxExecutor {
  readonly mode: ExecutorMode = "disabled";

  async run(
    spec: SandboxTaskSpec,
    _signal?: AbortSignal,
  ): Promise<SandboxRunResult> {
    const started = Date.now();
    const policy = evaluateCommandPolicy(spec.argv);

    return {
      taskId: spec.id,
      state: "failed",
      exitCode: null,
      signal: null,
      stdout: "",
      stderr: "",
      timedOut: false,
      cancelled: false,
      durationMs: Date.now() - started,
      refusedReason:
        policy.decision === "DENIED"
          ? policy.reason
          : "S1: executor disabled; untrusted code execution is not enabled",
    };
  }
}

/**
 * Merge caller limits with defaults (never allows zero/negative timeout).
 */
export function resolveLimits(
  partial?: Partial<import("./types.js").SandboxLimits>,
): import("./types.js").SandboxLimits {
  const timeoutMs = partial?.timeoutMs ?? DEFAULT_LIMITS.timeoutMs;
  const maxOutputBytes = partial?.maxOutputBytes ?? DEFAULT_LIMITS.maxOutputBytes;
  const maxWorkspaceBytes =
    partial?.maxWorkspaceBytes ?? DEFAULT_LIMITS.maxWorkspaceBytes;

  return {
    timeoutMs: Math.max(1, timeoutMs),
    maxOutputBytes: Math.max(0, maxOutputBytes),
    maxWorkspaceBytes: Math.max(0, maxWorkspaceBytes),
  };
}
