import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { isolatedDatabaseTestSkip } from "../src/lib/server/test-safety";
const skip = isolatedDatabaseTestSkip();
const origin = process.env.BETTER_AUTH_URL!;
const context = { params: Promise.resolve({ id: "unused" }) };
const request = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new Request(origin + path, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...headers },
    body: JSON.stringify(body),
  });
test(
  "real Argon2id registration, secure session, CSRF, privilege validation and logout",
  { skip },
  async () => {
    const { POST, GET } = await import("../src/app/api/auth/[...all]/route");
    const { GET: list, POST: create } =
      await import("../src/app/api/warranties/route");
    const { db } = await import("../src/lib/server/db");
    const email = `${randomUUID()}@example.com`;
    const input = {
      name: "Backend Buyer",
      email,
      password: `Generated-${randomUUID()}-${randomUUID()}`,
    };
    // Preserve rate-limit records; no bulk cleanup of the isolated test database.
    try {
      assert.equal(
        (
          await POST(
            request("/api/auth/sign-up/email", input, {
              origin: "https://evil.example",
            }),
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await POST(
            request("/api/auth/sign-up/email", { ...input, role: "admin" }),
          )
        ).status,
        400,
      );
      const registered = await POST(request("/api/auth/sign-up/email", input));
      assert.equal(registered.status, 200, await registered.clone().text());
      assert.equal(registered.headers.get("cache-control"), "no-store");
      const body = await registered.json();
      assert.equal(body.user.role, "buyer");
      const cookie = registered.headers
        .getSetCookie()
        .map((v) => v.split(";")[0])
        .join("; ");
      assert.match(registered.headers.get("set-cookie")!, /HttpOnly/i);
      assert.match(registered.headers.get("set-cookie")!, /SameSite=Lax/i);
      const account = await db().account.findFirstOrThrow({
        where: { userId: body.user.id },
      });
      assert.match(account.password!, /^\$argon2id\$/);
      const session = await GET(
        new Request(origin + "/api/auth/get-session", { headers: { cookie } }),
      );
      assert.equal((await session.json()).user.id, body.user.id);
      const result = await list(
        new Request(origin + "/api/warranties", { headers: { cookie } }),
        context,
      );
      assert.equal(result.status, 200);
      assert.equal((await result.json()).data.total, 0);
      const stale = await list(
        new Request(origin + "/api/warranties", { headers: { cookie, "x-workspace-user": "a-different-account" } }),
        context,
      );
      assert.equal(stale.status, 409);
      assert.equal((await stale.json()).error.code, "SESSION_CHANGED");
      assert.equal(
        (
          await create(
            request(
              "/api/warranties",
              {},
              { cookie, origin: "https://evil.example" },
            ),
            context,
          )
        ).status,
        403,
      );
      assert.equal(
        (await list(new Request(origin + "/api/warranties"), context)).status,
        401,
      );
      const loggedOut = await POST(
        request("/api/auth/sign-out", {}, { cookie }),
      );
      assert.equal(loggedOut.status, 200);
      const revoked = await GET(
        new Request(origin + "/api/auth/get-session", { headers: { cookie } }),
      );
      assert.equal(await revoked.json(), null);
      assert.ok((await db().rateLimit.count()) > 0);
    } finally {
      // Retain generated accounts and evidence; no fixture deletion.
      // Preserve rate-limit records; no bulk cleanup of the isolated test database.
      await db().$disconnect();
    }
  },
);
test(
  "auth rate limiting is database backed and cannot be bypassed by spoofed forwarded IP",
  { skip },
  async () => {
    const { POST } = await import("../src/app/api/auth/[...all]/route");
    const { db } = await import("../src/lib/server/db");
    // Preserve rate-limit records; no bulk cleanup of the isolated test database.
    try {
      let blocked = 0;
      for (let i = 0; i < 7; i++) {
        const response = await POST(
          request(
            "/api/auth/sign-in/email",
            { email: "absent@example.com", password: "invalid-password" },
            { "x-forwarded-for": `192.0.2.${i + 1}` },
          ),
        );
        if (response.status === 429) blocked++;
        else assert.equal(response.status, 401, await response.text());
      }
      assert.ok(blocked >= 2);
      assert.ok((await db().rateLimit.count()) > 0);
    } finally {
      // Preserve rate-limit records; no bulk cleanup of the isolated test database.
      await db().$disconnect();
    }
  },
);
