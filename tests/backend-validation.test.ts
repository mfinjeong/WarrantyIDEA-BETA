import test from "node:test";
import assert from "node:assert/strict";
import {
  warrantyInput,
  registrationInput,
  listQuery,
  calendarDay,
} from "../src/lib/server/validation";

test("strict registration rejects privilege escalation and invalid names", () => {
  const valid = {
    name: "Buyer Test",
    email: "buyer@example.com",
    password: "Very-strong-password-123",
  };
  assert.equal(registrationInput.safeParse(valid).success, true);
  assert.equal(
    registrationInput.safeParse({ ...valid, role: "admin" }).success,
    false,
  );
  assert.equal(
    registrationInput.safeParse({ ...valid, name: " " }).success,
    false,
  );
});
test("warranty validates real calendar dates, integer prices and ordered dates", () => {
  const v = {
    productName: "Phone",
    brand: "Brand",
    model: "Model",
    category: "electronics",
    serialNumber: "ABC-123",
    store: "Shop",
    purchaseDate: "2024-02-29",
    expiryDate: "2027-02-28",
    notes: "",
  };
  assert.equal(warrantyInput.safeParse(v).success, true);
  for (const patch of [
    { purchaseDate: "2025-02-29" },
    { price: 1.5 },
    { expiryDate: "2023-01-01" },
    { reviewStatus: "approved" },
    { purchaseDate: "9999-01-01" },
  ])
    assert.equal(warrantyInput.safeParse({ ...v, ...patch }).success, false);
  assert.equal(
    calendarDay(new Date("2026-01-01T23:30:00Z"), "Asia/Jakarta"),
    "2026-01-02",
  );
});
test("list query bounds pagination and rejects unknown keys", () => {
  assert.equal(listQuery.parse({}).pageSize, 6);
  for (const q of [
    { page: "0" },
    { pageSize: "101" },
    { sort: "sql" },
    { ownerId: "other" },
  ])
    assert.equal(listQuery.safeParse(q).success, false);
});
