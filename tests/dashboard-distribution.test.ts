import test from "node:test";
import assert from "node:assert/strict";
import { statusDistribution } from "../src/features/warranties/status-distribution";

test("status graph uses server totals and includes every status", () => {
  const result = statusDistribution({ total: 20, active: 12, expiring: 5, expired: 3 });
  assert.deepEqual(result.map(({ status, count, percentage }) => ({ status, count, percentage })), [
    { status: "active", count: 12, percentage: 60 },
    { status: "expiring", count: 5, percentage: 25 },
    { status: "expired", count: 3, percentage: 15 },
  ]);
});

test("empty status graph never invents data or divides by zero", () => {
  const result = statusDistribution({ total: 0, active: 0, expiring: 0, expired: 0 });
  assert.equal(result.length, 3);
  assert.ok(result.every(({ count, percentage }) => count === 0 && percentage === 0));
});

test("status graph clamps invalid geometry without mutating source stats", () => {
  const stats = { total: 10, active: 15, expiring: -3, expired: Number.NaN };
  const result = statusDistribution(stats);
  assert.deepEqual(result.map(({ count, percentage }) => [count, percentage]), [[15, 100], [0, 0], [0, 0]]);
  assert.equal(stats.expiring, -3);
  assert.ok(Number.isNaN(stats.expired));
  assert.ok(statusDistribution({ total: Number.POSITIVE_INFINITY, active: 1, expiring: 0, expired: 0 }).every(({ percentage }) => percentage === 0));
});
