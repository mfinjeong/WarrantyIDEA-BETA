import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  progress,
  today,
  validDate,
  warrantyStatus,
} from "../src/lib/format";
import { seed } from "../src/lib/demo/fixtures";
import {
  isDemoState,
  loadDemo,
  resetDemo,
  saveDemo,
  STORAGE_KEY,
  type StorageLike,
} from "../src/lib/demo/storage";
import { validateCatalog, validateWarranty } from "../src/lib/demo/validation";

test("masa berlaku membedakan kemarin, hari ini, hari ke-30 dan ke-31", () => {
  const now = "2026-10-16";
  assert.equal(warrantyStatus(addDays(now, -1), now), "expired");
  assert.equal(warrantyStatus(now, now), "expiring");
  assert.equal(warrantyStatus(addDays(now, 30), now), "expiring");
  assert.equal(warrantyStatus(addDays(now, 31), now), "active");
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2028-02-29"), true);
});
test("seed berisi variasi status dan tanggal kalender valid", () => {
  const data = seed();
  assert.equal(isDemoState(data), true);
  assert.equal(
    data.warranties.filter((w) => warrantyStatus(w.expiryDate) === "active")
      .length,
    4,
  );
  assert.equal(
    data.warranties.filter((w) => warrantyStatus(w.expiryDate) === "expiring")
      .length,
    2,
  );
  assert.equal(
    data.warranties.filter((w) => warrantyStatus(w.expiryDate) === "expired")
      .length,
    2,
  );
  assert.equal(data.catalog.length, 6);
  data.warranties.forEach((w) => assert.ok(w.purchaseDate <= today()));
});
test("validasi menolak serial duplikat, tanggal terbalik, harga pecahan; edit sendiri valid", () => {
  const data = seed();
  const input = { ...data.warranties[0] };
  assert.ok(validateWarranty(input, data.warranties).serialNumber);
  assert.deepEqual(validateWarranty(input, data.warranties, input.id), {});
  assert.ok(
    validateWarranty(
      { ...input, expiryDate: addDays(input.purchaseDate, -1) },
      [],
      input.id,
    ).expiryDate,
  );
  assert.ok(
    validateWarranty({ ...input, purchaseDate: addDays(today(), 1) }, [])
      .purchaseDate,
  );
  assert.ok(validateWarranty({ ...input, price: 12.5 }, []).price);
  assert.ok(validateWarranty({ ...input, notes: "x".repeat(1001) }, []).notes);
  assert.ok(
    validateCatalog(
      {
        ...data.catalog[1],
        brand: data.catalog[0].brand,
        model: data.catalog[0].model,
      },
      data.catalog,
    ).model,
  );
  assert.equal(
    Number.isFinite(
      progress({ ...input, purchaseDate: today(), expiryDate: today() }),
    ),
    true,
  );
});
function memory(): StorageLike & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
    removeItem: (k) => {
      values.delete(k);
    },
  };
}
test("persistensi, schema invalid, unknown field stripping, dan reset tidak menghapus key lain", () => {
  const storage = memory();
  const data = seed();
  data.profile.name = "Demo Test";
  assert.equal(saveDemo(storage, data), "");
  assert.equal(loadDemo(storage).state.profile.name, "Demo Test");
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...data, secret: "should disappear" }),
  );
  assert.equal("secret" in loadDemo(storage).state, false);
  storage.setItem(STORAGE_KEY, "{broken");
  assert.ok(loadDemo(storage).warning);
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: 2 }));
  assert.ok(loadDemo(storage).warning);
  assert.equal(isDemoState({ ...data, warranties: [{ id: "bad" }] }), false);
  storage.setItem("unrelated", "keep");
  resetDemo(storage);
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.equal(storage.getItem(STORAGE_KEY), null);
});
test("storage diblokir dan penuh ditangani tanpa melempar error", () => {
  const unavailable: StorageLike = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {},
  };
  assert.ok(loadDemo(unavailable).warning);
  assert.ok(saveDemo(unavailable, seed()));
});
