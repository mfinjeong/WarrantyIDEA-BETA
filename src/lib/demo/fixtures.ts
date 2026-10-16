import { addDays, today } from "../format";
import type { DemoState, Warranty } from "./types";

export function seed(): DemoState {
  const base = today();
  const products = [
    ["Headphone wireless", "Sonic", "Quiet 700", "electronics", 240, 2499000],
    ["Mesin kopi espresso", "Forma", "Brew Mini", "home", 18, 3299000],
    ["Laptop ultrabook", "Nova", "Book Air 14", "electronics", 320, 12499000],
    ["Air purifier", "Aera", "Pure 2", "home", 7, 1899000],
    ["Kamera mirrorless", "Lumina", "X-T30", "electronics", 145, 8999000],
    ["Smartwatch", "Orbit", "Watch S", "electronics", 90, 2199000],
    ["Speaker portable", "Sonic", "Move", "electronics", -12, 899000],
    ["Blender compact", "Forma", "Mix Go", "home", -45, 649000],
  ] as const;
  const warranties: Warranty[] = products.map((p, i) => ({
    id: `w${i + 1}`,
    productName: p[0],
    brand: p[1],
    model: p[2],
    category: p[3],
    serialNumber: `DEMO-${p[1].toUpperCase()}-${1001 + i}`,
    store: i % 2 ? "Studio Rumah Demo" : "IDEA Electronics Demo",
    purchaseDate: addDays(base, -365 + Number(p[4])),
    expiryDate: addDays(base, Number(p[4])),
    price: p[5],
    notes: "Data produk fiktif untuk menjelajahi WarrantyIDEA.",
    reviewStatus: i < 3 ? "pending" : i === 6 ? "rejected" : "approved",
    reviewNote:
      i === 6
        ? "Contoh penolakan: detail nomor seri perlu dilengkapi."
        : undefined,
    createdAt: `${addDays(base, -i)}T08:00:00`,
    updatedAt: `${addDays(base, -i)}T08:00:00`,
    receiptDemoAssetId: i < 5 ? "sample" : undefined,
  }));
  return {
    version: 1,
    warranties,
    catalog: warranties.slice(0, 6).map((w, i) => ({
      id: `p${i + 1}`,
      name: w.productName,
      brand: w.brand,
      model: w.model,
      category: w.category,
      warrantyMonths: 12,
      active: i !== 5,
    })),
    notifications: Array.from({ length: 8 }, (_, i) => ({
      id: i < 2 ? `reminder-w${i === 0 ? 2 : 4}` : `n${i}`,
      audience: i < 5 ? ("buyer" as const) : ("admin" as const),
      title:
        i < 2
          ? "Masa garansi segera berakhir"
          : i < 5
            ? "Arsip demo siap dijelajahi"
            : "Garansi menunggu tinjauan",
      body:
        i < 2
          ? `${warranties[i === 0 ? 1 : 3].productName} akan segera berakhir. Periksa detailnya.`
          : "Lihat informasi produk dan kelola arsip garansi demo Anda.",
      createdAt: `${addDays(base, -i)}T09:00:00`,
      readAt: i === 4 ? `${base}T10:00:00` : undefined,
      href:
        i < 5
          ? `/app/warranties/w${i === 0 ? 2 : i === 1 ? 4 : i + 1}`
          : `/admin/reviews/w${i - 4}`,
    })),
    profile: { name: "Alex Morgan", reminders: true },
    activity: [],
  };
}
