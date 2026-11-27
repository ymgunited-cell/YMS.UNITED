/**
 * S1 unit tests — do NOT execute untrusted code on the host.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { resolveInsideRoot, PathSafetyError, isInsideRoot } from "./paths.js";
import { evaluateCommandPolicy } from "./policy.js";
import { createWorkspace, cleanupWorkspace } from "./workspace.js";
import { DisabledSandboxExecutor, resolveLimits } from "./executor.js";

describe("path safety", () => {
  const root = "/tmp/yms-sandbox-test-root";

  it("resolves relative path inside root", () => {
    const p = resolveInsideRoot(root, "file.txt");
    assert.equal(p, path.resolve(root, "file.txt"));
  });

  it("rejects path traversal with ..", () => {
    assert.throws(() => resolveInsideRoot(root, "../etc/passwd"), PathSafetyError);
  });

  it("rejects absolute path outside root", () => {
    assert.throws(() => resolveInsideRoot(root, "/etc/passwd"), PathSafetyError);
  });

  it("rejects null byte", () => {
    assert.throws(() => resolveInsideRoot(root, "a\0b"), PathSafetyError);
  });

  it("isInsideRoot returns false for escape", () => {
    assert.equal(isInsideRoot(root, "/etc/passwd"), false);
  });
});

describe("command policy (deny-by-default)", () => {
  it("denies empty argv", () => {
    const r = evaluateCommandPolicy([]);
    assert.equal(r.decision, "DENIED");
  });

  it("denies shell metacharacters", () => {
    const r = evaluateCommandPolicy(["node", "a;rm -rf /"]);
    assert.equal(r.decision, "DENIED");
  });

  it("denies curl", () => {
    const r = evaluateCommandPolicy(["curl", "http://example.com"]);
    assert.equal(r.decision, "DENIED");
  });

  it("denies even future-allowlisted interpreters in S1", () => {
    const r = evaluateCommandPolicy(["node", "app.js"]);
    assert.equal(r.decision, "DENIED");
    assert.match(r.reason, /S1|isolated|not enabled|allowlist|denied/i);
  });

  it("denies unknown commands", () => {
    const r = evaluateCommandPolicy(["totally-unknown-bin"]);
    assert.equal(r.decision, "DENIED");
  });
});

describe("workspace lifecycle", () => {
  let baseDir: string;

  before(async () => {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), "yms-ws-test-"));
  });

  after(async () => {
    await fs.rm(baseDir, { recursive: true, force: true });
  });

  it("creates and cleans up a workspace under baseDir", async () => {
    const handle = await createWorkspace(undefined, baseDir);
    assert.ok(handle.dir.startsWith(baseDir));
    const stat = await fs.stat(handle.dir);
    assert.ok(stat.isDirectory());

    await cleanupWorkspace(handle, baseDir);
    await assert.rejects(() => fs.stat(handle.dir), /ENOENT/);
  });

  it("rejects illegal taskId", async () => {
    await assert.rejects(
      () => createWorkspace("../escape", baseDir),
      PathSafetyError,
    );
  });
});

describe("DisabledSandboxExecutor", () => {
  it("never runs code and returns refusedReason", async () => {
    const executor = new DisabledSandboxExecutor();
    assert.equal(executor.mode, "disabled");

    const result = await executor.run({
      id: "t1",
      workspaceDir: "/tmp/yms-sandbox/t1",
      argv: ["node", "-e", "console.log(1)"],
    });

    assert.equal(result.state, "failed");
    assert.equal(result.exitCode, null);
    assert.ok(result.refusedReason && result.refusedReason.length > 0);
    assert.equal(result.stdout, "");
    assert.equal(result.timedOut, false);
  });

  it("resolveLimits applies defaults and floors", () => {
    const d = resolveLimits();
    assert.ok(d.timeoutMs > 0);
    const z = resolveLimits({ timeoutMs: -5 });
    assert.equal(z.timeoutMs, 1);
  });
});
