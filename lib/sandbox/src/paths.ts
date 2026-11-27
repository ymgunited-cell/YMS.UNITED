/**
 * Path safety helpers for sandbox workspaces.
 * Prevents path traversal and keeps all operations under a root.
 */

import path from "node:path";

export class PathSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathSafetyError";
  }
}

/**
 * Resolve `candidate` under `root` and ensure the result stays inside root.
 * Rejects absolute candidates that escape, `..` segments, and empty paths.
 */
export function resolveInsideRoot(root: string, candidate: string): string {
  if (!root || !path.isAbsolute(root)) {
    throw new PathSafetyError("workspace root must be an absolute path");
  }
  if (!candidate || candidate.trim() === "") {
    throw new PathSafetyError("path candidate must be non-empty");
  }

  // Disallow null bytes
  if (candidate.includes("\0") || root.includes("\0")) {
    throw new PathSafetyError("path contains null byte");
  }

  const rootResolved = path.resolve(root);
  const target = path.isAbsolute(candidate)
    ? path.resolve(candidate)
    : path.resolve(rootResolved, candidate);

  const relative = path.relative(rootResolved, target);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new PathSafetyError(
      `path escapes workspace root: ${candidate}`,
    );
  }

  return target;
}

/** True if `target` is equal to or inside `root`. */
export function isInsideRoot(root: string, target: string): boolean {
  try {
    resolveInsideRoot(root, target);
    return true;
  } catch {
    return false;
  }
}
