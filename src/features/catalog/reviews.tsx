"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Search,
  XCircle,
} from "lucide-react";
import {

  Alert,
  Badge,
  Button,
  Dialog,
  Empty,
  Field,
  Missing,
  PageHeading,
  Skeleton,
  Tabs,
} from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import type { ReviewStatus } from "@/lib/demo/types";
import { dateLabel } from "@/lib/format";
import { ProductIdentity, ProductIcon } from "@/features/warranties/product";
import { ReceiptDisplay } from "@/features/warranties/receipt";
import { WarrantyInformation } from "@/features/warranties/detail";

export function ReviewsPage() {
  const { state } = useDemo();
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState(params.get("status") || "all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  if (!state) return <Skeleton />;
  const filtered = state.warranties
    .filter(
      (w) =>
        (status === "all" || w.reviewStatus === status) &&
        [w.productName, w.serialNumber].some((v) =>
          v.toLowerCase().includes(q.trim().toLowerCase()),
        ),
    )
    .sort(
      (a, b) =>
        Number(b.reviewStatus === "pending") -
          Number(a.reviewStatus === "pending") ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * 6, current * 6);
  return (
    <>
      <PageHeading
        eyebrow="ADMIN / ANTREAN TINJAUAN"
        title="Tinjauan garansi"
        description="Periksa detail dan catat keputusan tinjauan."
      />
      <Tabs
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
          router.replace(`/admin/reviews${v === "all" ? "" : `?status=${v}`}`, {
            scroll: false,
          });
        }}
        items={[
          { value: "all", label: "Semua" },
          { value: "pending", label: "Menunggu" },
          { value: "approved", label: "Disetujui" },
          { value: "rejected", label: "Ditolak" },
        ]}
      />
      <section className="panel">
        <div className="filters">
          <div className="search-field">
            <label htmlFor="reviews-search" className="sr-only">
              Cari produk atau serial untuk ditinjau
            </label>
            <Search size={18} />
            <input
              id="reviews-search"
              value={q}
              placeholder="Cari produk atau nomor seri…"
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="collection-meta">
          {filtered.length} garansi ditemukan
        </div>
        {visible.length ? (
          <>
            <div
              className="table-wrap"
              role="region"
              aria-label="Daftar tinjauan"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Diperbarui</th>
                    <th>Tinjauan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <ProductIdentity product={w} />
                      </td>
                      <td className="date-cell">
                        {dateLabel(w.updatedAt.slice(0, 10))}
                      </td>
                      <td>
                        <Badge status={w.reviewStatus} />
                      </td>
                      <td>
                        <Link
                          href={`/admin/reviews/${w.id}`}
                          className="text-link"
                        >
                          Lihat tinjauan <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {visible.map((w) => (
                <article key={w.id} className="warranty-card">
                  <ProductIdentity product={w} />
                  <div className="warranty-card-badges">
                    <Badge status={w.reviewStatus} />
                  </div>
                  <Link className="text-link" href={`/admin/reviews/${w.id}`}>
                    Lihat tinjauan <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </>
        ) : (
          <Empty
            title="Tidak ada tinjauan yang cocok"
            description="Coba ubah filter status atau kata kunci pencarian."
          />
        )}
        <div className="pagination">
          <span>
            Halaman {current} dari {pages}
          </span>
          <div>
            <Button
              variant="secondary"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
export function ReviewDetail({ id }: { id: string }) {
  const { state, repository } = useDemo();
  const [action, setAction] = useState<ReviewStatus | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state) return <Skeleton />;
  const item = state.warranties.find((w) => w.id === id);
  if (!item) return <Missing admin />;
  function close() {
    if (!busy) {
      setAction(null);
      setError("");
      setNote("");
    }
  }
  return (
    <>
      <Link href="/admin/reviews" className="back-link">
        <ArrowLeft size={16} />
        Kembali ke antrean tinjauan
      </Link>
      <PageHeading
        eyebrow="ADMIN / TINJAUAN GARANSI"
        title="Periksa setiap detail."
        description="Tinjau informasi sebelum menentukan status garansi."
      />
      <Alert>
        Keputusan mencatat hasil tinjauan; tidak menjamin keaslian
        produk.
      </Alert>
      <div className="detail-hero">
        <ProductIcon name={item.productName} large />
        <div>
          <h2>{item.productName}</h2>
          <p>
            {item.brand} · {item.model}
          </p>
          <Badge status={item.reviewStatus} />
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <WarrantyInformation item={item} />
          <section className="panel detail-information">
            <h2>Keputusan tinjauan</h2>
            {item.reviewStatus === "pending" ? (
              <>
                <p className="helper">
                  Periksa detail produk yang tersedia. Preview nota bersifat
                  lokal dan bukan bukti yang diunggah ke server.
                </p>
                <div className="review-actions">
                  <Button onClick={() => setAction("approved")}>
                    <CheckCircle2 size={18} />
                    Setujui
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setAction("rejected")}
                  >
                    <XCircle size={18} />
                    Tolak
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Badge status={item.reviewStatus} />
                <p className="helper mt-4">
                  {item.reviewNote || "Keputusan tinjauan telah dicatat."}
                </p>
                <Button
                  variant="secondary"
                  className="mt-5"
                  onClick={() => setAction("pending")}
                >
                  Tinjau ulang
                </Button>
              </>
            )}
          </section>

        </div>
        <ReceiptDisplay id={id} sample={!!item.receiptDemoAssetId} />
      </div>
      <Dialog
        open={!!action}
        title={
          action === "approved"
            ? "Setujui tinjauan garansi?"
            : action === "rejected"
              ? "Tolak tinjauan garansi?"
              : "Kembalikan ke antrean?"
        }
        description={
          action === "pending"
            ? "Keputusan sebelumnya akan dihapus dan status menjadi menunggu tinjauan."
            : `Keputusan untuk ${item.productName} akan disimpan dan pembeli menerima notifikasi.`
        }
        onClose={close}
      >
        <form
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              action === "rejected" &&
              (note.trim().length < 10 || note.length > 500)
            ) {
              setError("Alasan harus 10–500 karakter.");
              document.getElementById("review-note")?.focus();
              return;
            }
            setBusy(true);
            setError("");
            try {
              if (item.revision === undefined)
                throw new Error("Muat ulang garansi sebelum menyimpan keputusan.");
              await repository.review(id, action!, item.revision, note);
              setAction(null);
              setNote("");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Gagal menyimpan keputusan.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {action === "rejected" && (
            <Field
              id="review-note"
              label="Alasan penolakan"
              required
              error={error}
            >
              <textarea
                id="review-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                aria-invalid={!!error}
                aria-describedby="review-note-help"
                placeholder="Jelaskan detail yang perlu diperbaiki…"
              />
            </Field>
          )}
          {error && action !== "rejected" && <Alert error>{error}</Alert>}
          <div className="dialog-actions">
            <Button
              variant="secondary"
              type="button"
              data-autofocus
              onClick={close}
              disabled={busy}
            >
              Batal
            </Button>
            <Button
              variant={action === "rejected" ? "danger" : "primary"}
              type="submit"
              busy={busy}
            >
              {action === "approved"
                ? "Setujui"
                : action === "rejected"
                  ? "Tolak"
                  : "Kembalikan ke antrean"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
