/**
 * Workspace lifecycle: create a unique directory under a base root, and clean it up.
 * Does not execute untrusted code.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { resolveInsideRoot, PathSafetyError } from "./paths.js";

export interface WorkspaceHandle {
  taskId: string;
  /** Absolute path to the workspace directory */
  dir: string;
}

function defaultBaseDir(): string {
  // Prefer /tmp which supports normal FS operations in constrained environments.
  return path.join("/tmp", "yms-sandbox");
}

/**
 * Create a unique workspace directory for a task under baseDir.
 * baseDir itself is created if missing. Returns absolute paths only.
 */
export async function createWorkspace(
  taskId?: string,
  baseDir: string = defaultBaseDir(),
): Promise<WorkspaceHandle> {
  if (!path.isAbsolute(baseDir)) {
    throw new PathSafetyError("baseDir must be absolute");
  }

  const id = taskId && taskId.trim() !== "" ? taskId : randomBytes(8).toString("hex");
  // Prevent taskId from escaping baseDir
  if (id.includes("..") || id.includes("/") || id.includes("\\") || id.includes("\0")) {
    throw new PathSafetyError("taskId contains illegal characters");
  }

  await fs.mkdir(baseDir, { recursive: true, mode: 0o700 });
  const dir = resolveInsideRoot(baseDir, id);
  await fs.mkdir(dir, { recursive: false, mode: 0o700 });

  return { taskId: id, dir };
}

/**
 * Remove a workspace directory. Only deletes if path is under expected baseDir.
 */
export async function cleanupWorkspace(
  handle: WorkspaceHandle,
  baseDir: string = defaultBaseDir(),
): Promise<void> {
  if (!path.isAbsolute(baseDir)) {
    throw new PathSafetyError("baseDir must be absolute");
  }
  // Ensure handle.dir is inside baseDir before rm
  resolveInsideRoot(baseDir, handle.dir);
  await fs.rm(handle.dir, { recursive: true, force: true });
}
