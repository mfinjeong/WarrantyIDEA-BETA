import { test } from "node:test";
import assert from "node:assert/strict";

test("API client unwraps data and sends same-origin no-store requests", async () => {
  const { api } = await import("../../src/lib/api-client");
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    assert.equal(init?.credentials, "same-origin");
    assert.equal(init?.cache, "no-store");
    return Response.json({ data: { total: 7 } });
  };
  try { assert.deepEqual(await api("/api/dashboard"), { total: 7 }); }
  finally { globalThis.fetch = original; }
});

test("API client preserves server errors instead of substituting demo data", async () => {
  const { api, ApiError } = await import("../../src/lib/api-client");
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: { code: "FORBIDDEN", message: "Denied" } }, { status: 403 });
  try { await assert.rejects(api("/api/workspace"), (error: unknown) => error instanceof ApiError && error.status === 403 && error.message === "Denied"); }
  finally { globalThis.fetch = original; }
});
