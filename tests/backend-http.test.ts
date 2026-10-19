import test from "node:test";
import assert from "node:assert/strict";
import { isolatedDatabaseTestSkip } from "../src/lib/server/test-safety";
const skip = isolatedDatabaseTestSkip();
import { authOrigin } from "../src/lib/server/config";
import { errorResponse, jsonBody } from "../src/lib/server/http";
test("native session responses cannot be cached", { skip }, async () => {
  const { GET } = await import("../src/app/api/auth/[...all]/route");
  const { db } = await import("../src/lib/server/db");
  try {
    const response = await GET(
      new Request(process.env.BETTER_AUTH_URL + "/api/auth/get-session"),
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(await response.json(), null);
  } finally {
    await db().$disconnect();
  }
});
test("HTTP JSON bounds and structured errors never expose SQL or secrets", async () => {
  await assert.rejects(
    jsonBody(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"notes":"' + "x".repeat(17000) + '"}',
      }),
    ),
    { status: 413 },
  );
  const response = errorResponse(
    new Error("SELECT password FROM secret_table; secret=123"),
  );
  assert.equal(response.status, 500);
  assert.equal(JSON.stringify(await response.json()).includes("secret"), false);
});
test("production requires an explicit HTTPS auth origin", () => {
  const env: Record<string, string | undefined> = process.env;
  const previous = env.NODE_ENV;
  const origin = process.env.BETTER_AUTH_URL;
  try {
    env.NODE_ENV = "production";
    process.env.BETTER_AUTH_URL = "http://127.0.0.1:3000";
    assert.throws(authOrigin, /HTTPS/);
    process.env.BETTER_AUTH_URL = "https://warranty.example";
    assert.equal(authOrigin(), "https://warranty.example");
  } finally {
    if (previous === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = previous;
    if (origin === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = origin;
  }
});
