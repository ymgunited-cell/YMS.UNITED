/**
 * Sandbox S1 — shared types.
 *
 * Execution of untrusted code is intentionally NOT enabled in S1.
 * These types define the contract for a future isolated executor.
 */

export type SandboxTaskState =
  | "created"
  | "prepared"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "cleaned";

/** How an executor is allowed to run (S1 only exposes "disabled"). */
export type ExecutorMode = "disabled" | "isolated"; // "isolated" reserved; not activated in S1

export interface SandboxLimits {
  /** Max wall-clock time in milliseconds */
  timeoutMs: number;
  /** Max combined stdout+stderr bytes retained */
  maxOutputBytes: number;
  /** Max workspace size in bytes (best-effort) */
  maxWorkspaceBytes: number;
}

export const DEFAULT_LIMITS: Readonly<SandboxLimits> = {
  timeoutMs: 15_000,
  maxOutputBytes: 256_000,
  maxWorkspaceBytes: 16 * 1024 * 1024,
};

export interface SandboxTaskSpec {
  /** Stable id for the task (caller-generated or auto) */
  id: string;
  /** Absolute path to the task workspace root (managed by Sandbox) */
  workspaceDir: string;
  /** argv to run — never a shell string */
  argv: string[];
  /** Optional env whitelist (never inherits process.env secrets) */
  env?: Record<string, string>;
  limits?: Partial<SandboxLimits>;
}

export interface SandboxRunResult {
  taskId: string;
  state: SandboxTaskState;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  cancelled: boolean;
  durationMs: number;
  /** Machine-readable reason when execution was refused */
  refusedReason?: string;
}

export interface SandboxExecutor {
  readonly mode: ExecutorMode;
  /**
   * Run a prepared task. Implementations must not trust caller paths
   * and must enforce policy. The disabled executor always refuses.
   */
  run(spec: SandboxTaskSpec, signal?: AbortSignal): Promise<SandboxRunResult>;
}
