import test from "node:test";
import assert from "node:assert/strict";
import { prepareAuthRequest } from "../src/lib/server/trusted-proxy";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { isolatedDatabaseTestSkip } from "../src/lib/server/test-safety";

const secret = "test-proxy-proof-only-" + "x".repeat(32);
const production = { NODE_ENV: "production", TRUSTED_PROXY_SECRET: secret };
const request = (
  headers: Record<string, string> = {},
  url = "https://app.example/api/auth/get-session",
) => new Request(url, { headers });

test("production rejects missing configuration and missing proxy proof without leaking secrets", () => {
  for (const env of [
    { NODE_ENV: "production" },
    { NODE_ENV: "production", TRUSTED_PROXY_SECRET: "short" },
    production,
  ]) {
    assert.throws(
      () => prepareAuthRequest(request({ "x-real-ip": "192.0.2.1" }), env),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Authentication is temporarily unavailable.",
        );
        assert.ok(!error.message.includes(secret));
        return true;
      },
    );
  }
});

test("authenticated proxy handoff strips secrets and forged client headers for two distinct addresses", () => {
  for (const ip of ["192.0.2.17", "198.51.100.18"]) {
    const sanitized = prepareAuthRequest(
      request({
        "x-warrantyidea-proxy-secret": secret,
        "x-real-ip": ip,
        "x-warrantyidea-client-ip": "203.0.113.99",
        "x-forwarded-for": "203.0.113.98",
        "client-ip": "203.0.113.97",
        cookie: "session=preserved",
      }),
      production,
    );
    assert.equal(sanitized.headers.get("x-warrantyidea-client-ip"), ip);
    assert.equal(sanitized.headers.get("x-warrantyidea-proxy-secret"), null);
    assert.equal(sanitized.headers.get("x-forwarded-for"), null);
    assert.equal(sanitized.headers.get("client-ip"), null);
    assert.equal(sanitized.headers.get("x-real-ip"), null);
    assert.equal(sanitized.headers.get("cookie"), "session=preserved");
  }
});

test("forged headers, invalid proofs and malformed real IPs cannot authenticate a handoff", () => {
  for (const proof of [
    undefined,
    "wrong",
    "y".repeat(secret.length),
    secret + "suffix",
  ]) {
    assert.throws(() =>
      prepareAuthRequest(
        request({
          ...(proof ? { "x-warrantyidea-proxy-secret": proof } : {}),
          "x-real-ip": "192.0.2.1",
          "x-forwarded-for": "192.0.2.2",
          "x-warrantyidea-client-ip": "192.0.2.3",
        }),
        production,
      ),
    );
  }
  for (const ip of [
    "",
    "garbage",
    "192.0.2.1, 192.0.2.2",
    "192.0.2.1:80",
    "[2001:db8::1]",
    "fe80::1%eth0",
    "::1%1",
  ]) {
    assert.throws(() =>
      prepareAuthRequest(
        request({ "x-warrantyidea-proxy-secret": secret, "x-real-ip": ip }),
        production,
      ),
    );
  }
});

test("authenticated IPv6 spellings normalize to the same identity", () => {
  for (const ip of ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"]) {
    const sanitized = prepareAuthRequest(
      request({ "x-warrantyidea-proxy-secret": secret, "x-real-ip": ip }),
      production,
    );
    assert.equal(
      sanitized.headers.get("x-warrantyidea-client-ip"),
      "2001:db8::1",
    );
  }
});

test("nonproduction loopback development ignores spoofed headers; nonloopback fails closed", () => {
  for (const host of ["127.0.0.1", "localhost", "[::1]"]) {
    const sanitized = prepareAuthRequest(
      request(
        {
          "x-real-ip": "192.0.2.1",
          "x-warrantyidea-client-ip": "192.0.2.2",
          "x-forwarded-for": "192.0.2.3",
        },
        `http://${host}:3000/api/auth/get-session`,
      ),
      { NODE_ENV: "test" },
    );
    assert.equal(
      sanitized.headers.get("x-warrantyidea-client-ip"),
      "127.0.0.1",
    );
  }
  assert.throws(() =>
    prepareAuthRequest(request(), { NODE_ENV: "development" }),
  );
  assert.throws(() =>
    prepareAuthRequest(
      request(
        { "x-warrantyidea-proxy-secret": "wrong" },
        "http://localhost:3000/api/auth/get-session",
      ),
      { NODE_ENV: "test", TRUSTED_PROXY_SECRET: secret },
    ),
  );
});

test("Vercel runtime trusts only its platform-overwritten IP header", () => {
  const env = { NODE_ENV: "production", VERCEL: "1" };
  const sanitized = prepareAuthRequest(request({
    "x-vercel-forwarded-for": "192.0.2.17",
    "x-forwarded-for": "203.0.113.1",
    "x-real-ip": "203.0.113.2",
    "x-warrantyidea-client-ip": "203.0.113.3",
    "x-warrantyidea-proxy-secret": "forged",
  }), env);
  assert.equal(sanitized.headers.get("x-warrantyidea-client-ip"), "192.0.2.17");
  assert.equal(sanitized.headers.get("x-vercel-forwarded-for"), null);
  assert.equal(sanitized.headers.get("x-warrantyidea-proxy-secret"), null);
  for (const ip of ["", "garbage", "192.0.2.1, 192.0.2.2", "fe80::1%eth0"])
    assert.throws(() => prepareAuthRequest(request({ "x-vercel-forwarded-for": ip }), env));
  assert.throws(() => prepareAuthRequest(request({ "x-vercel-forwarded-for": "192.0.2.17" }), { NODE_ENV: "production" }));
});

const databaseSkip = isolatedDatabaseTestSkip();
test(
  "production route fails closed with absent or weak proxy configuration in isolated child processes",
  { skip: databaseSkip },
  async () => {
    const { db } = await import("../src/lib/server/db");
    try {
      const before = await db().rateLimit.count();
      for (const configured of [undefined, "short"]) {
        const env: NodeJS.ProcessEnv = {
          ...process.env,
          NODE_ENV: "production",
          BETTER_AUTH_URL: "https://localhost:3000",
        };
        delete env.TRUSTED_PROXY_SECRET;
        if (configured) env.TRUSTED_PROXY_SECRET = configured;
        const child = spawnSync(
          process.execPath,
          [
            "--import",
            "tsx",
            "--input-type=module",
            "--eval",
            `
        const { GET } = await import("./src/app/api/auth/[...all]/route.ts");
        const response = await GET(new Request(process.env.BETTER_AUTH_URL + "/api/auth/get-session", {
          headers: { "x-real-ip": "192.0.2.1", "x-warrantyidea-client-ip": "192.0.2.2" }
        }));
        console.log(JSON.stringify({ status: response.status, cache: response.headers.get("cache-control"), body: await response.json() }));
      `,
          ],
          { env, encoding: "utf8", timeout: 30000 },
        );
        assert.equal(
          child.status,
          0,
          "isolated production auth process must exit normally",
        );
        assert.deepEqual(JSON.parse(child.stdout.trim()), {
          status: 503,
          cache: "no-store",
          body: {
            error: {
              code: "AUTH_PROXY_UNAVAILABLE",
              message: "Authentication is temporarily unavailable.",
            },
          },
        });
      }
      assert.equal(await db().rateLimit.count(), before);
    } finally {
      await db().$disconnect();
    }
  },
);

test(
  "public auth wrapper rejects forged proxy proof before database rate-limit effects",
  { skip: databaseSkip },
  async () => {
    const { GET } = await import("../src/app/api/auth/[...all]/route");
    const { db } = await import("../src/lib/server/db");
    try {
      const before = await db().rateLimit.count();
      const response = await GET(
        new Request(process.env.BETTER_AUTH_URL! + "/api/auth/get-session", {
          headers: {
            "x-warrantyidea-proxy-secret": "forged-proof",
            "x-warrantyidea-client-ip": "192.0.2.9",
            "x-real-ip": "192.0.2.10",
          },
        }),
      );
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), {
        error: {
          code: "AUTH_PROXY_UNAVAILABLE",
          message: "Authentication is temporarily unavailable.",
        },
      });
      assert.equal(await db().rateLimit.count(), before);
    } finally {
      await db().$disconnect();
    }
  },
);

test(
  "real Better Auth database buckets are independent for two authenticated proxy IPs",
  { skip: databaseSkip },
  async () => {
    const { auth } = await import("../src/lib/server/auth");
    const { db } = await import("../src/lib/server/db");
    const nonce = randomUUID().replaceAll("-", "");
    const prefix = `fd${nonce.slice(0, 2)}:${nonce.slice(2, 6)}:${nonce.slice(6, 10)}`;
    const ips = [`${prefix}:1::1`, `${prefix}:2::1`];
    const origin = process.env.BETTER_AUTH_URL!;
    const send = (ip: string, spoof: string) =>
      auth.handler(
        prepareAuthRequest(
          new Request(origin + "/api/auth/sign-in/email", {
            method: "POST",
            headers: {
              origin,
              "content-type": "application/json",
              "x-warrantyidea-proxy-secret": secret,
              "x-real-ip": ip,
              "x-forwarded-for": spoof,
              "x-warrantyidea-client-ip": spoof,
            },
            body: JSON.stringify({
              email: `${nonce}@example.com`,
              password: "invalid-password",
            }),
          }),
          production,
        ),
      );
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++)
        statuses.push((await send(ips[0], `192.0.2.${i + 1}`)).status);
      assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);
      const independent = await send(ips[1], "192.0.2.1");
      assert.equal(independent.status, 401, await independent.text());
      // Read back exact bucket records; retain all evidence, never delete fixtures.
      const buckets = await db().rateLimit.findMany({
        where: { key: { startsWith: prefix } },
      });
      assert.equal(buckets.length, 2);
      assert.deepEqual(
        buckets.map((bucket) => bucket.count).sort((a, b) => a - b),
        [1, 5],
      );
    } finally {
      await db().$disconnect();
    }
  },
);
