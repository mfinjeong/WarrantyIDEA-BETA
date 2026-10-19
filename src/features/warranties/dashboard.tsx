"use client";
import Link from "next/link";
import { ArrowRight, Clock3, FileImage, Plus, ScanLine } from "lucide-react";
import { useDemo } from "@/lib/demo/provider";
import { dateLabel, remaining, warrantyStatus } from "@/lib/format";
import {
  ActionLink,
  Badge,
  Empty,
  PageHeading,
  Skeleton,
} from "@/components/ui";
import { ProductIdentity } from "./product";

export function BuyerDashboard() {
  const { state } = useDemo();
  if (!state) return <Skeleton />;
  const all = state.warranties;
  const expiring = all
    .filter((w) => warrantyStatus(w.expiryDate) === "expiring")
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  return (
    <div className="buyer-dashboard">
      <PageHeading
        eyebrow="RINGKASAN PRIBADI"
        title={`Halo, ${state.profile.name.split(" ")[0]}.`}
        description="Lihat garansi yang masih berlaku dan yang perlu diperiksa."
      >
        <ActionLink href="/app/warranties/new">
          <Plus size={18} />
          Tambah garansi
        </ActionLink>
      </PageHeading>
      <div className="summary-strip">
        {[
          ["Total garansi", state.stats.total, "Produk yang sudah kamu catat", ""],
          [
            "Garansi aktif",
            state.stats.active,
            "Masih dalam masa berlaku",
            "active",
          ],
          [
            "Segera berakhir",
            state.stats.expiring,
            "Berakhir dalam 30 hari",
            "expiring",
          ],
        ].map(([label, note, desc, status]) => (
          <Link
            href={`/app/warranties${status ? `?status=${status}` : ""}`}
            key={label}
          >
            <span className="summary-label">
              {label}
              <ArrowRight size={16} />
            </span>
            <strong>
              {String(note).padStart(2, "0")}
              <span
                className={`summary-dot ${status === "expiring" ? "amber-dot" : ""}`}
              />
            </strong>
            <span className="muted">{desc}</span>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel expiry-panel">
            <div className="section-heading">
              <div className="icon-heading">
                <span className="amber-icon">
                  <Clock3 size={19} />
                </span>
                <div>
                  <h2>Berakhir dalam 30 hari</h2>
                  <p>Periksa tanggalnya sebelum mengajukan klaim.</p>
                </div>
              </div>
              <Link
                href="/app/warranties?status=expiring"
                className="subtle-link"
                aria-label="Lihat semua garansi segera berakhir"
              >
                <ArrowRight size={20} />
              </Link>
            </div>
            {expiring.length ? (
              expiring.map((w) => (
                <Link
                  key={w.id}
                  className="expiry-row"
                  href={`/app/warranties/${w.id}`}
                >
                  <ProductIdentity product={w} />
                  <div>
                    <strong>{remaining(w.expiryDate)}</strong>
                    <span>{dateLabel(w.expiryDate)}</span>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))
            ) : (
              <Empty
                title="Belum ada yang segera berakhir"
                description="Tidak ada garansi yang berakhir dalam 30 hari ke depan."
              />
            )}
          </section>
          <section className="panel recent-panel">
            <div className="section-heading">
              <div>
                <h2>Baru ditambahkan</h2>
                <p>Garansi terakhir yang kamu simpan.</p>
              </div>
              <Link href="/app/warranties" className="text-link">
                Lihat semua <ArrowRight size={16} />
              </Link>
            </div>
            <form action="/app/warranties" className="dashboard-search">
              <label className="sr-only" htmlFor="dashboard-search">
                Cari garansi
              </label>
              <input
                id="dashboard-search"
                name="q"
                placeholder="Cari produk, merek, atau nomor seri…"
              />
              <label className="sr-only" htmlFor="dashboard-status">
                Status garansi
              </label>
              <select id="dashboard-status" name="status">
                <option value="">Semua status</option>
                <option value="active">Aktif</option>
                <option value="expiring">Segera berakhir</option>
                <option value="expired">Kedaluwarsa</option>
              </select>
              <button className="btn btn-secondary" type="submit">
                Cari
              </button>
            </form>
            {all.length ? (
              <div className="recent-list">
                {[...all]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 4)
                  .map((w) => (
                    <Link
                      href={`/app/warranties/${w.id}`}
                      key={w.id}
                      className="recent-row"
                    >
                      <ProductIdentity product={w} />
                      <div className="recent-status">
                        <Badge status={warrantyStatus(w.expiryDate)} />
                        <span>{dateLabel(w.expiryDate)}</span>
                      </div>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
              </div>
            ) : (
              <Empty>
                <ActionLink href="/app/warranties/new">
                  Tambah garansi
                </ActionLink>
              </Empty>
            )}
          </section>
        </div>
        <aside className="dashboard-aside">
          <div className="panel scan-promo">
            <div className="scan-promo-header">
              <span className="scan-icon">
                <ScanLine size={24} strokeWidth={1.5} />
              </span>
              <span className="tiny-label">SIMULASI SCAN</span>
            </div>
            <h2>
              Coba alur scan
            </h2>
            <p>
              Coba alur scan untuk menambahkan detail produk dengan data contoh.
            </p>
            <ActionLink href="/app/scan" secondary>
              Buka simulasi scan <ArrowRight size={17} />
            </ActionLink>
            <small>Simulasi · Kamera & OCR belum tersedia</small>
          </div>
          <div className="panel receipt-note">
            <span className="tiny-label">CATATAN KECIL</span>
            <h3>Nota tetap di perangkat Anda.</h3>
            <p>
              Pilih gambar untuk preview lokal. Gambar tidak diunggah dan hilang
              setelah halaman dimuat ulang.
            </p>
            <FileImage className="note-symbol" size={24} aria-hidden="true" />
          </div>
          <div className="workspace-footer">
            WARRANTYIDEA / RUANG PRIBADI
            <br />
            <span>Tanggal beli. Nomor seri. Masa garansi.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
