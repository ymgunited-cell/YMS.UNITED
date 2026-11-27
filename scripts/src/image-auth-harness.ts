/**
 * P3 focused auth tests for image/anime route protection.
 * Pure node:http — no Express dependency. Does NOT call paid AI APIs.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { strict as assert } from "node:assert";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

function requireUserId(
  userId: string | null | undefined,
  res: ServerResponse,
): string | null {
  if (!userId) {
    sendJson(res, 401, { error: "Unauthorized" });
    return null;
  }
  return userId;
}

function createHandler(options: {
  getUserId: () => string | null | undefined;
  onProviderCall: () => void;
}) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || "";
    if (req.method !== "POST") {
      sendJson(res, 404, { error: "not found" });
      return;
    }

    if (url === "/api/openai/generate-image") {
      const userId = requireUserId(options.getUserId(), res);
      if (!userId) return;
      const body = (await readJson(req)) as { prompt?: string };
      if (!body.prompt || !body.prompt.trim()) {
        sendJson(res, 400, { error: "prompt required" });
        return;
      }
      options.onProviderCall();
      sendJson(res, 200, { url: "data:image/png;base64,TEST" });
      return;
    }

    if (url === "/api/openai/anime") {
      const userId = requireUserId(options.getUserId(), res);
      if (!userId) return;
      const body = (await readJson(req)) as { imageBase64?: string };
      if (!body.imageBase64) {
        sendJson(res, 400, { error: "imageBase64 required" });
        return;
      }
      options.onProviderCall();
      sendJson(res, 200, { url: "data:image/png;base64,TEST", description: "test" });
      return;
    }

    sendJson(res, 404, { error: "not found" });
  };
}

async function withServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  fn: (baseUrl: string) => Promise<void>,
) {
  const server = createServer((req, res) => {
    Promise.resolve(handler(req, res)).catch(() => {
      if (!res.headersSent) sendJson(res, 500, { error: "internal" });
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });
  const addr = server.address();
  assert.ok(addr && typeof addr === "object");
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("unauthenticated generate-image → 401 and no provider call", async () => {
  let providerCalls = 0;
  const handler = createHandler({
    getUserId: () => null,
    onProviderCall: () => {
      providerCalls += 1;
    },
  });
  await withServer(handler, async (base) => {
    const res = await fetch(`${base}/api/openai/generate-image`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "a cat" }),
    });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "Unauthorized" });
    assert.equal(providerCalls, 0);
  });
});

test("unauthenticated anime → 401 and no provider call", async () => {
  let providerCalls = 0;
  const handler = createHandler({
    getUserId: () => null,
    onProviderCall: () => {
      providerCalls += 1;
    },
  });
  await withServer(handler, async (base) => {
    const res = await fetch(`${base}/api/openai/anime`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageBase64: "abc" }),
    });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "Unauthorized" });
    assert.equal(providerCalls, 0);
  });
});

test("authenticated generate-image reaches handler; empty prompt still 400", async () => {
  let providerCalls = 0;
  const handler = createHandler({
    getUserId: () => "user_test_1",
    onProviderCall: () => {
      providerCalls += 1;
    },
  });
  await withServer(handler, async (base) => {
    const bad = await fetch(`${base}/api/openai/generate-image`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "  " }),
    });
    assert.equal(bad.status, 400);
    assert.equal(providerCalls, 0);

    const ok = await fetch(`${base}/api/openai/generate-image`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "a cat" }),
    });
    assert.equal(ok.status, 200);
    assert.equal(providerCalls, 1);
  });
});

test("authenticated anime reaches handler; missing imageBase64 still 400", async () => {
  let providerCalls = 0;
  const handler = createHandler({
    getUserId: () => "user_test_2",
    onProviderCall: () => {
      providerCalls += 1;
    },
  });
  await withServer(handler, async (base) => {
    const bad = await fetch(`${base}/api/openai/anime`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(bad.status, 400);
    assert.equal(providerCalls, 0);

    const ok = await fetch(`${base}/api/openai/anime`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imageBase64: "abc" }),
    });
    assert.equal(ok.status, 200);
    assert.equal(providerCalls, 1);
  });
});

test("production route sources call requireUserId before provider work", async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, "../../artifacts/api-server/src/routes/openai");
  const gen = await readFile(path.join(root, "generate-image.ts"), "utf8");
  const anime = await readFile(path.join(root, "anime.ts"), "utf8");
  const helper = await readFile(path.join(root, "require-user.ts"), "utf8");

  assert.match(helper, /getAuth/);
  assert.match(helper, /401/);
  assert.match(helper, /Unauthorized/);

  for (const src of [gen, anime]) {
    assert.match(src, /requireUserId/);
    const authIdx = src.indexOf("requireUserId");
    const providerIdx = src.search(/openai\.(images|chat)/);
    assert.ok(authIdx >= 0);
    assert.ok(providerIdx >= 0);
    assert.ok(authIdx < providerIdx, "auth gate must appear before provider calls");
  }
});
