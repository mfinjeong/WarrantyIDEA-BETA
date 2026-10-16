"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  ActionLink,
  Badge,
  Button,
  ConfirmDialog,
  Missing,
  Skeleton,
} from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import { categories, type Warranty } from "@/lib/demo/types";
import {
  dateLabel,
  progress,
  remaining,
  rupiah,
  warrantyStatus,
} from "@/lib/format";
import { ProductIcon } from "./product";
import { ReceiptDisplay } from "./receipt";

export function WarrantyInformation({ item }: { item: Warranty }) {
  return (
    <section className="panel detail-information">
      <h2>Detail produk & pembelian</h2>
      <dl className="info-grid">
        {[
          ["Merek", item.brand],
          ["Model", item.model],
          ["Kategori", categories[item.category]],
          ["Nomor seri", item.serialNumber],
          ["Tanggal pembelian", dateLabel(item.purchaseDate)],
          ["Tanggal berakhir", dateLabel(item.expiryDate)],
          ["Toko pembelian", item.store],
          ["Harga pembelian", rupiah(item.price)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="info-notes">
        <strong>Catatan</strong>
        <p>{item.notes || "—"}</p>
      </div>
    </section>
  );
}
export function WarrantyDetail({ id }: { id: string }) {
  const { state, repository } = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const [remove, setRemove] = useState(false);
  if (!state) return <Skeleton />;
  const item = state.warranties.find((w) => w.id === id);
  if (!item) return <Missing />;
  const from = params.get("from");
  const back =
    from?.startsWith("/app/warranties") && !from.startsWith("//")
      ? from
      : "/app/warranties";
  return (
    <>
      <Link href={back} className="back-link">
        <ArrowLeft size={16} />
        Kembali ke daftar garansi
      </Link>
      <div className="page-heading">
        <div className="detail-hero">
          <ProductIcon name={item.productName} large />
          <div>
            <h1>{item.productName}</h1>
            <p>
              {item.brand} · {item.model}
            </p>
            <div className="detail-badges">
              <Badge status={warrantyStatus(item.expiryDate)} />
              <Badge status={item.reviewStatus} />
            </div>
          </div>
        </div>
        <div className="heading-actions">
          <ActionLink href={`/app/warranties/${id}/edit`} secondary>
            <Pencil size={16} />
            Edit
          </ActionLink>
          <Button variant="ghost" onClick={() => setRemove(true)}>
            <Trash2 size={16} />
            Hapus
          </Button>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <WarrantyInformation item={item} />
          <section className="panel detail-information">
            <h2>Tinjauan demo</h2>
            <Badge status={item.reviewStatus} />
            <p className="helper" style={{ marginTop: 16 }}>
              {item.reviewNote ||
                "Status tinjauan hanya berlaku untuk demonstrasi dan bukan verifikasi keaslian produk."}
            </p>
          </section>
        </div>
        <aside>
          <section className="panel expiry-detail">
            <h2>Masa berlaku garansi</h2>
            <Badge status={warrantyStatus(item.expiryDate)} />
            <strong>{remaining(item.expiryDate)}</strong>
            <p>Berakhir {dateLabel(item.expiryDate)}</p>
            <div
              className="progress-track"
              role="img"
              aria-label={`${Math.round(progress(item))}% masa garansi telah berlalu`}
            >
              <span style={{ width: `${progress(item)}%` }} />
            </div>
            <div className="progress-dates">
              <span>{dateLabel(item.purchaseDate)}</span>
              <span>{dateLabel(item.expiryDate)}</span>
            </div>
          </section>
          <ReceiptDisplay id={id} sample={!!item.receiptDemoAssetId} />
          {!item.receiptDemoAssetId && (
            <Link className="text-link" href={`/app/warranties/${id}/edit`}>
              Tambahkan preview nota <Pencil size={14} />
            </Link>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={remove}
        title="Hapus garansi?"
        description={`Metadata demo ${item.productName} dan preview lokalnya akan dihapus.`}
        onClose={() => setRemove(false)}
        onConfirm={async () => {
          await repository.removeWarranty(id);
          router.push("/app/warranties");
        }}
        label="Hapus garansi"
      />
    </>
  );
}
