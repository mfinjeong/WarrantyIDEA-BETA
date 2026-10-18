import test from "node:test";
import assert from "node:assert/strict";
import { today, warrantyStatus } from "../src/lib/format";
import { configureBusinessTimeZone } from "../src/lib/calendar";
import { calendarDay } from "../src/lib/server/validation";

test("business calendar does not follow the device UTC date near Jakarta midnight", () => {
  const businessDay = today(new Date("2026-10-17T18:00:00Z"));
  assert.equal(businessDay, "2026-10-18");
  assert.equal(warrantyStatus("2026-10-17", businessDay), "expired");
  assert.equal(today(new Date("2026-10-18T18:00:00Z")), "2026-10-19");
});

test("client calendar accepts bootstrap timezone and matches server without freezing the date", () => {
  const instant = new Date("2026-10-17T18:00:00Z");
  try {
    configureBusinessTimeZone("America/Los_Angeles");
    assert.equal(today(instant), "2026-10-17");
    assert.equal(today(instant), calendarDay(instant, "America/Los_Angeles"));
    assert.throws(() => configureBusinessTimeZone("not-an-iana-timezone"));
    assert.equal(today(instant), "2026-10-17");
    configureBusinessTimeZone("Asia/Jakarta");
    assert.equal(today(instant), calendarDay(instant, "Asia/Jakarta"));
    assert.equal(today(instant), "2026-10-18");
    assert.equal(today(new Date("2026-10-18T18:00:00Z")), "2026-10-19");
  } finally { configureBusinessTimeZone("Asia/Jakarta"); }
});
