import { today, validDate } from "../format";
import type { CatalogProduct, Warranty, WarrantyInput } from "./types";

export type Errors = Record<string, string>;
export function validateWarranty(
  v: WarrantyInput,
  all: Warranty[],
  id?: string,
): Errors {
  const errors: Errors = {};
  for (const [key, label, min, max] of [
    ["productName", "Nama produk", 2, 100],
    ["brand", "Merek", 2, 60],
    ["model", "Model", 2, 60],
    ["serialNumber", "Nomor seri", 3, 80],
    ["store", "Toko", 2, 100],
  ] as const) {
    if (v[key].trim().length < min || v[key].trim().length > max)
      errors[key] = `${label} harus ${min}–${max} karakter.`;
  }
  if (!["electronics", "home", "other"].includes(v.category))
    errors.category = "Pilih kategori.";
  if (
    all.some(
      (w) =>
        w.id !== id &&
        w.serialNumber.trim().toLowerCase() ===
          v.serialNumber.trim().toLowerCase(),
    )
  )
    errors.serialNumber = "Nomor seri sudah ada pada garansi lain.";
  if (!validDate(v.purchaseDate) || v.purchaseDate > today())
    errors.purchaseDate =
      "Tanggal pembelian harus valid dan tidak setelah hari ini.";
  if (!validDate(v.expiryDate) || v.expiryDate < v.purchaseDate)
    errors.expiryDate = "Tanggal berakhir tidak boleh sebelum pembelian.";
  if (
    v.price !== undefined &&
    (!Number.isSafeInteger(v.price) || v.price < 0 || v.price > 999999999999)
  )
    errors.price = "Masukkan harga rupiah bulat antara 0–999.999.999.999.";
  if (v.notes.length > 1000) errors.notes = "Catatan maksimal 1.000 karakter.";
  return errors;
}
export function validateCatalog(
  v: CatalogProduct,
  all: CatalogProduct[],
): Errors {
  const errors: Errors = {};
  for (const [key, max] of [
    ["name", 100],
    ["brand", 60],
    ["model", 60],
  ] as const)
    if (v[key].trim().length < 2 || v[key].trim().length > max)
      errors[key] = `Isi 2–${max} karakter.`;
  if (
    all.some(
      (p) =>
        p.id !== v.id &&
        p.brand.trim().toLowerCase() === v.brand.trim().toLowerCase() &&
        p.model.trim().toLowerCase() === v.model.trim().toLowerCase(),
    )
  )
    errors.model = "Pasangan merek dan model sudah ada.";
  if (
    !Number.isInteger(v.warrantyMonths) ||
    v.warrantyMonths < 1 ||
    v.warrantyMonths > 120
  )
    errors.warrantyMonths = "Isi 1–120 bulan.";
  return errors;
}
