import type { WorkspaceStats, WarrantyStatus } from "@/lib/demo/types";

export type StatusShare = {
  status: WarrantyStatus;
  label: string;
  detail: string;
  count: number;
  percentage: number;
};

/** Independent bars use the authoritative total, never the bounded record list. */
export function statusDistribution(
  stats: Pick<WorkspaceStats, "total" | "active" | "expiring" | "expired">,
): StatusShare[] {
  const safeCount = (value: number) =>
    Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  const total = safeCount(stats.total);
  const definitions = [
    ["active", "Aktif", "Lebih dari 30 hari tersisa"],
    ["expiring", "Segera berakhir", "Berakhir dalam 30 hari"],
    ["expired", "Kedaluwarsa", "Masa garansi telah berakhir"],
  ] as const;
  return definitions.map(([status, label, detail]) => {
    const count = safeCount(stats[status]);
    return {
      status,
      label,
      detail,
      count,
      percentage: total === 0 ? 0 : Math.min(100, (count / total) * 100),
    };
  });
}
