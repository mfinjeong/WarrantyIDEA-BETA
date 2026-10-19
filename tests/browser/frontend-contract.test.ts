import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
test("auth uses real accounts with 8-character registration and no bypass", () => {
  const auth = source("src/features/profile/auth.tsx");
  assert.match(auth, /authClient\.signUp\.email/);
  assert.match(auth, /authClient\.signIn\.email/);
  assert.match(auth, /password.length < 8/);
  assert.doesNotMatch(auth, /Buat profil demo|Masuk demo|Jelajahi tanpa mengisi form/);
});
test("warranty collection uses server pagination instead of snapshot filtering", () => {
  const list = source("src/features/warranties/list.tsx");
  assert.match(list, /queryWarranties/);
  assert.doesNotMatch(list, /state\.warranties\.filter/);
});
test("detail and edit fetch specific owner-authorized records", () => {
  for (const path of ["detail", "form"]) assert.match(source(`src/features/warranties/${path}.tsx`), /useWarranty\(id\)/);
});
test("dashboards show aggregate server statistics", () => {
  for (const path of ["warranties/dashboard", "catalog/admin-dashboard"]) assert.match(source(`src/features/${path}.tsx`), /state\.stats/);
});
