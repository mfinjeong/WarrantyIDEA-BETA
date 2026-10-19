import test from "node:test";
import assert from "node:assert/strict";
import { databaseConfig } from "../src/lib/server/database-config";

test("custom database CA retains certificate verification and cannot be overridden by URL SSL parameters", () => {
  const config = databaseConfig("postgresql://test:test@db.example/test?schema=warrantyidea&sslmode=require&sslrootcert=other&uselibpqcompat=true", "test-ca");
  assert.deepEqual(config.ssl, { ca: "test-ca", rejectUnauthorized: true });
  const url = new URL(config.connectionString!);
  assert.equal(url.searchParams.get("schema"), "warrantyidea");
  for (const key of ["sslmode", "sslrootcert", "uselibpqcompat"]) assert.equal(url.searchParams.has(key), false);
  assert.deepEqual(databaseConfig("postgresql://localhost/test"), { connectionString: "postgresql://localhost/test", max: 10 });
});
