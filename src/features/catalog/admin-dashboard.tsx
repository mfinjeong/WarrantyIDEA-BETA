"use client";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Package } from "lucide-react";
import {
  ActionLink,
  Badge,
  Empty,
  PageHeading,
  Skeleton,
} from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import { ProductIdentity } from "@/features/warranties/product";
import { dateLabel } from "@/lib/format";

export function AdminDashboard() {
  const { state } = useDemo();
  if (!state) return <Skeleton />;
  const pending = state.warranties
    .filter((w) => w.reviewStatus === "pending")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <>
      <PageHeading
        eyebrow="ADMIN / RUANG KERJA"
        title="Pusat tinjauan"
        description="Satu ruang untuk katalog yang rapi dan detail yang teliti."
      >
        <ActionLink href="/admin/reviews">
          <ClipboardCheck size={18} />
          Buka antrean tinjauan
        </ActionLink>
      </PageHeading>
      <div className="summary-strip">
        {[
          ["Total katalog", state.stats.catalog, "/admin/catalog"],
          [
            "Menunggu tinjauan",
            state.stats.pending,
            "/admin/reviews?status=pending",
          ],
          [
            "Disetujui",
            state.stats.approved,
            "/admin/reviews?status=approved",
          ],
        ].map(([label, n, href]) => (
          <Link href={String(href)} key={label}>
            <span className="summary-label">
              {label}
              <ArrowRight size={16} />
            </span>
            <strong>{String(n).padStart(2, "0")}</strong>
            <span className="muted">Ringkasan server</span>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel recent-panel">
            <div className="section-heading">
              <div>
                <h2>Menunggu perhatian Anda</h2>
                <p>Garansi terbaru yang belum ditinjau.</p>
              </div>
              <Link href="/admin/reviews" className="text-link">
                Lihat semua <ArrowRight size={16} />
              </Link>
            </div>
            {pending.length ? (
              pending.slice(0, 5).map((w) => (
                <Link
                  className="recent-row"
                  key={w.id}
                  href={`/admin/reviews/${w.id}`}
                >
                  <ProductIdentity product={w} />
                  <Badge status="pending" />
                  <ArrowRight size={16} />
                </Link>
              ))
            ) : (
              <Empty
                title="Antrean sudah rapi"
                description="Belum ada garansi yang menunggu tinjauan."
              />
            )}
          </section>
          <section className="panel recent-panel">
            <div className="section-heading">
              <div>
                <h2>Aktivitas tinjauan</h2>
                <p>Riwayat keputusan tinjauan.</p>
              </div>
            </div>
            {state.activity.length ? (
              state.activity.slice(0, 5).map((a) => (
                <div className="activity-row" key={a.id}>
                  {a.text}
                  <time dateTime={a.date}>
                    {dateLabel(a.date.slice(0, 10))}
                  </time>
                </div>
              ))
            ) : (
              <Empty
                title="Belum ada keputusan"
                description="Mulai tinjau garansi untuk melihat aktivitas di sini."
              />
            )}
          </section>
        </div>
        <aside className="dashboard-aside">
          <div className="admin-intro">
            <Package size={32} />
            <h2 className="mt-4">Katalog yang tertata.</h2>
            <p>
              {state.catalog.filter((p) => p.active).length} produk aktif dari{" "}
              {state.stats.catalog} produk katalog.
            </p>
            <Link href="/admin/catalog" className="btn btn-secondary mt-5">
              Kelola katalog <ArrowRight size={16} />
            </Link>
          </div>
          <div className="receipt-note">
            <span className="tiny-label">CATATAN TINJAUAN</span>
            <h3>Keputusan tercatat.</h3>
            <p>
              Status tinjauan tidak membuktikan keaslian produk atau dokumen.
              Akses tinjauan dibatasi untuk admin.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
