import { seed } from "./fixtures";
import type { DemoState } from "./types";
import { validDate } from "../format";

export const STORAGE_KEY = "warrantyidea:demo:v1";
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
function object(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const str = (v: unknown) => typeof v === "string";
export function isDemoState(value: unknown): value is DemoState {
  if (
    !object(value) ||
    value.version !== 1 ||
    !object(value.profile) ||
    !str(value.profile.name) ||
    typeof value.profile.reminders !== "boolean"
  )
    return false;
  if (
    !Array.isArray(value.warranties) ||
    !Array.isArray(value.catalog) ||
    !Array.isArray(value.notifications) ||
    !Array.isArray(value.activity)
  )
    return false;
  return (
    value.warranties.every(
      (w) =>
        object(w) &&
        [
          "id",
          "productName",
          "brand",
          "model",
          "serialNumber",
          "store",
          "notes",
          "createdAt",
          "updatedAt",
        ].every((k) => str(w[k])) &&
        str(w.purchaseDate) &&
        validDate(w.purchaseDate) &&
        str(w.expiryDate) &&
        validDate(w.expiryDate) &&
        w.expiryDate >= w.purchaseDate &&
        ["electronics", "home", "other"].includes(String(w.category)) &&
        ["pending", "approved", "rejected"].includes(String(w.reviewStatus)) &&
        (w.price === undefined ||
          (typeof w.price === "number" &&
            Number.isSafeInteger(w.price) &&
            w.price >= 0)) &&
        (w.reviewNote === undefined || str(w.reviewNote)) &&
        (w.receiptDemoAssetId === undefined ||
          w.receiptDemoAssetId === "sample"),
    ) &&
    value.catalog.every(
      (p) =>
        object(p) &&
        ["id", "name", "brand", "model"].every((k) => str(p[k])) &&
        ["electronics", "home", "other"].includes(String(p.category)) &&
        typeof p.active === "boolean" &&
        typeof p.warrantyMonths === "number" &&
        Number.isInteger(p.warrantyMonths) &&
        p.warrantyMonths >= 1 &&
        p.warrantyMonths <= 120,
    ) &&
    value.notifications.every(
      (n) =>
        object(n) &&
        ["id", "title", "body", "createdAt"].every((k) => str(n[k])) &&
        ["buyer", "admin"].includes(String(n.audience)) &&
        (n.readAt === undefined || str(n.readAt)) &&
        (n.href === undefined ||
          (str(n.href) && /^\/(app|admin)(\/|$)/.test(n.href))),
    ) &&
    value.activity.every(
      (a) => object(a) && ["id", "text", "date"].every((k) => str(a[k])),
    )
  );
}
export function loadDemo(storage: StorageLike): {
  state: DemoState;
  warning: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: seed(), warning: "" };
    const parsed: unknown = JSON.parse(raw);
    if (!isDemoState(parsed)) throw new Error("invalid");
    // Reconstruct only the declared metadata; unknown fields never get persisted.
    const state: DemoState = {
      version: 1,
      profile: {
        name: parsed.profile.name,
        reminders: parsed.profile.reminders,
      },
      warranties: parsed.warranties.map((w) => ({
        id: w.id,
        productName: w.productName,
        brand: w.brand,
        model: w.model,
        category: w.category,
        serialNumber: w.serialNumber,
        store: w.store,
        purchaseDate: w.purchaseDate,
        expiryDate: w.expiryDate,
        price: w.price,
        notes: w.notes,
        reviewStatus: w.reviewStatus,
        reviewNote: w.reviewNote,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        receiptDemoAssetId: w.receiptDemoAssetId,
      })),
      catalog: parsed.catalog.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        model: p.model,
        category: p.category,
        warrantyMonths: p.warrantyMonths,
        active: p.active,
      })),
      notifications: parsed.notifications.map((n) => ({
        id: n.id,
        audience: n.audience,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt,
        readAt: n.readAt,
        href: n.href,
      })),
      activity: parsed.activity.map((a) => ({
        id: a.id,
        text: a.text,
        date: a.date,
      })),
    };
    return { state, warning: "" };
  } catch {
    return {
      state: seed(),
      warning:
        "Penyimpanan demo tidak tersedia atau datanya tidak valid. Data contoh dimuat kembali; perubahan mungkin hanya bertahan di sesi ini.",
    };
  }
}
export function saveDemo(storage: StorageLike, state: DemoState): string {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return "";
  } catch {
    return "Penyimpanan tidak tersedia atau penuh. Perubahan hanya bertahan di sesi ini.";
  }
}
export function resetDemo(storage: StorageLike): DemoState {
  storage.removeItem(STORAGE_KEY);
  return seed();
}
