/**
 * @workspace/sandbox — S1 Minimal Execution Core (interfaces + safety only)
 *
 * What S1 provides:
 * - Path safety (resolveInsideRoot)
 * - Deny-by-default command policy
 * - Workspace create/cleanup
 * - Disabled executor that never runs untrusted code
 *
 * What S1 does NOT provide:
 * - OS-level isolation (namespaces/cgroups/seccomp) activated for untrusted code
 * - Public API routes
 * - Integration with chat / OpenAI
 * - Any claim that untrusted code is safe to run on the host
 */

export type {
  SandboxTaskState,
  ExecutorMode,
  SandboxLimits,
  SandboxTaskSpec,
  SandboxRunResult,
  SandboxExecutor,
} from "./types.js";
export { DEFAULT_LIMITS } from "./types.js";

export { PathSafetyError, resolveInsideRoot, isInsideRoot } from "./paths.js";
export { evaluateCommandPolicy } from "./policy.js";
export type { PolicyDecision, PolicyResult } from "./policy.js";
export { createWorkspace, cleanupWorkspace } from "./workspace.js";
export type { WorkspaceHandle } from "./workspace.js";
export { DisabledSandboxExecutor, resolveLimits } from "./executor.js";
