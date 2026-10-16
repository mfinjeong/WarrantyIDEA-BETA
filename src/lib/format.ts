import type { Warranty, WarrantyStatus } from "./demo/types";

export function today(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dayNumber(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const n = dayNumber(value);
  return (
    Number.isFinite(n) &&
    new Date(n * 86400000).toISOString().slice(0, 10) === value
  );
}
export function addDays(value: string, days: number): string {
  return new Date((dayNumber(value) + days) * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function daysLeft(expiry: string, now = today()) {
  return dayNumber(expiry) - dayNumber(now);
}
export function warrantyStatus(expiry: string, now = today()): WarrantyStatus {
  const days = daysLeft(expiry, now);
  return days < 0 ? "expired" : days <= 30 ? "expiring" : "active";
}
export function remaining(expiry: string) {
  const days = daysLeft(expiry);
  return days < 0
    ? `Berakhir ${Math.abs(days)} hari lalu`
    : days === 0
      ? "Berakhir hari ini"
      : `${days} hari tersisa`;
}
export function dateLabel(value: string) {
  if (!validDate(value)) return "—";
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
export function rupiah(value?: number) {
  return value === undefined
    ? "—"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(value);
}
export function progress(w: Warranty) {
  const total = dayNumber(w.expiryDate) - dayNumber(w.purchaseDate);
  return total <= 0
    ? daysLeft(w.expiryDate) < 0
      ? 100
      : 0
    : Math.max(
        0,
        Math.min(
          100,
          ((dayNumber(today()) - dayNumber(w.purchaseDate)) / total) * 100,
        ),
      );
}
