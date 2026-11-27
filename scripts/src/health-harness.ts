/**
 * Isolated Health Test Harness
 *
 * Imports the REAL production health router and verifies:
 *   - GET /api/healthz returns HTTP 200
 *   - Body is { "status": "ok" }
 *
 * Does NOT import db, OpenAI, Clerk, or any production startup path.
 * Does NOT require DATABASE_URL, AI_INTEGRATIONS_*, or Clerk keys.
 * Does NOT start the full production server.
 */

import { createServer } from "node:http";
import { strict as assert } from "node:assert";
import test from "node:test";
import express from "express";

// Real production health router — not a reimplementation
import healthRouter from "../../artifacts/api-server/src/routes/health.ts";

function createIsolatedApp() {
  const app = express();
  // Mirror production mount: app.use("/api", router) where router mounts health at /healthz
  app.use("/api", healthRouter);
  return app;
}

test("GET /api/healthz returns 200 and { status: \"ok\" }", async () => {
  const app = createIsolatedApp();
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object", "server must have an address");
  const port = address.port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/healthz`);
    assert.equal(res.status, 200, `expected HTTP 200, got ${res.status}`);

    const body = await res.json();
    assert.deepEqual(body, { status: "ok" }, `expected { status: "ok" }, got ${JSON.stringify(body)}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
