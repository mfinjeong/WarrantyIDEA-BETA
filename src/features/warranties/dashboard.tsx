"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  Clock3,
  Hash,
  Store,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { statusDistribution } from "./status-distribution";
import "./dashboard.css";
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

const percentageFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export function BuyerDashboard() {
  const { state } = useDemo();
  if (!state) return <Skeleton />;
  const all = state.warranties;
  const expiring = all
    .filter((w) => warrantyStatus(w.expiryDate) === "expiring")
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    .slice(0, 3);
  return (
    <div className="buyer-dashboard">
      <PageHeading
        title={`Halo, ${state.profile.name.split(" ")[0]}.`}
        description="Lihat garansi yang masih berlaku dan yang perlu diperiksa."
      >
        <ActionLink href="/app/warranties/new">
          <Plus size={18} />
          Tambah garansi
        </ActionLink>
      </PageHeading>
      <section
        className="panel coverage-panel"
        aria-labelledby="coverage-title"
      >
        <div className="coverage-intro">
          <ShieldCheck size={30} strokeWidth={1.5} aria-hidden="true" />
          <h2 id="coverage-title">Status garansi</h2>
          <Link href="/app/warranties" className="coverage-total">
            <strong>{state.stats.total}</strong> garansi tercatat{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p>
            Seluruh arsip menurut tanggal berakhir. Pilih status untuk membuka
            daftar.
          </p>
        </div>
        <ul className="coverage-bars" aria-label="Distribusi status garansi">
          {statusDistribution(state.stats).map(
            ({ status, label, detail, count, percentage }) => (
              <li key={status}>
                <Link
                  href={`/app/warranties?status=${status}`}
                  className={`coverage-link coverage-${status}`}
                >
                  <span className="coverage-label">
                    <span>{label}</span>
                    <span>
                      <strong>{count}</strong>
                      <span className="coverage-percentage">
                        {percentageFormatter.format(percentage)}
                        %
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </span>
                  <span className="coverage-track" aria-hidden="true">
                    <span
                      className="coverage-fill"
                      style={{ "--coverage-share": percentage / 100 } as CSSProperties}
                    />
                  </span>
                  <span className="coverage-detail">{detail}</span>
                </Link>
              </li>
            ),
          )}
        </ul>
        {state.stats.total === 0 && (
          <p className="coverage-zero">
            Belum ada data distribusi. Tambahkan garansi pertama untuk mulai
            mencatat masa berlaku.
          </p>
        )}
      </section>
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
                  <p>
                    Tiga tanggal terdekat di ringkasan ini. Buka daftar untuk melihat semua.
                  </p>
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
                title={state.stats.expiring === 0 ? "Belum ada yang segera berakhir" : "Ada garansi yang perlu dicek"}
                description={
                  state.stats.expiring === 0
                    ? "Tidak ada garansi yang berakhir dalam 30 hari ke depan."
                    : "Produk yang segera berakhir tidak ada dalam cuplikan ini. Buka daftar lengkap untuk memeriksanya."
                }
              />
            )}
          </section>
          <section className="panel recent-panel">
            <div className="section-heading">
              <div>
                <h2>Baru ditambahkan</h2>
                <p>Empat catatan terakhir di ringkasan akun.</p>
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
                      <div className="workspace-product-details">
                        <ProductIdentity product={w} />
                        <span className="workspace-product-meta">
                          <Store size={13} aria-hidden="true" />
                          {w.store || "Toko belum dicatat"} · Beli{" "}
                          {dateLabel(w.purchaseDate)}
                        </span>
                        <span className="workspace-product-meta">
                          <Hash size={13} aria-hidden="true" />
                          {w.serialNumber || "Nomor seri belum dicatat"}
                        </span>
                      </div>
                      <div className="recent-status">
                        <Badge status={warrantyStatus(w.expiryDate)} />
                        <span>{dateLabel(w.expiryDate)}</span>
                      </div>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
              </div>
            ) : (
              <Empty
                title={
                  state.stats.total === 0
                    ? "Catat garansi pertama"
                    : "Buka daftar lengkap"
                }
                description={
                  state.stats.total === 0
                    ? "Siapkan nama produk, merek, model, nomor seri, toko, tanggal beli, dan tanggal berakhir garansi."
                    : "Produk belum tampil di ringkasan. Buka daftar garansi untuk melihat semua."
                }
              >
                <ActionLink href={state.stats.total === 0 ? "/app/warranties/new" : "/app/warranties"}>
                  {state.stats.total === 0 ? "Tambah garansi" : "Buka semua garansi"}
                </ActionLink>
              </Empty>
            )}
          </section>
        </div>
        <aside className="dashboard-aside">
          <nav className="workspace-actions" aria-label="Aksi garansi">
            <h2>Kelola arsip</h2>
            <Link href="/app/warranties/new">
              <Plus size={20} aria-hidden="true" />
              <span>
                Catat garansi
                <small>Isi detail produk dan tanggal garansi</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/app/warranties">
              <Store size={20} aria-hidden="true" />
              <span>
                Buka semua garansi<small>Cari dan perbarui detail produk</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/app/warranties?status=expired">
              <Clock3 size={20} aria-hidden="true" />
              <span>
                Periksa yang kedaluwarsa
                <small>Lihat catatan yang masa berlakunya habis</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </nav>
          <section className="workspace-preparation" aria-labelledby="preparation-title">
            <span className="workspace-archive-art" aria-hidden="true" />
            <h2 id="preparation-title">Siapkan sebelum mencatat</h2>
            <ul>
              <li>Nama produk, merek, dan model</li>
              <li>Nomor seri pada barang atau kemasan</li>
              <li>Toko, tanggal beli, dan akhir garansi</li>
            </ul>
            <p>Nota bisa dilihat sebagai preview lokal saat mengisi. Simpan berkas aslinya sendiri.</p>
            <a className="workspace-asset-credit" href="/licenses/openmoji-attribution.txt">Ilustrasi: Sina Schulz / OpenMoji</a>
          </section>
        </aside>
      </div>
    </div>
  );
}
