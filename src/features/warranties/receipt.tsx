"use client";
/* eslint-disable @next/next/no-img-element -- Blob URLs stay local and must not pass through an image optimizer. */
import { useId, useState } from "react";
import { FileImage, Trash2, Upload } from "lucide-react";
import { Alert, Button, Dialog } from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import type { Receipt } from "@/lib/demo/types";

export function ReceiptUpload({
  value,
  onChange,
}: {
  value?: Receipt;
  onChange: (receipt?: Receipt) => void;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function choose(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Pilih gambar JPG, PNG, atau WebP. PDF belum didukung.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      onChange({ url, name: file.name, size: file.size });
    } catch {
      URL.revokeObjectURL(url);
      setError("Gambar tidak dapat dibuka. Pilih gambar lain.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <div
        className="upload-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void choose(e.dataTransfer.files[0]);
        }}
      >
        <Upload size={28} />
        <h3>Tempat kecil untuk bukti pembelian</h3>
        <p>
          JPG, PNG, atau WebP · maksimal 5 MB
          <br />
          Hanya preview lokal. Gunakan gambar fiktif.
        </p>
        <input
          className="sr-only"
          type="file"
          id={id}
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <label htmlFor={id} className="btn btn-secondary">
          {busy
            ? "Memeriksa gambar…"
            : value
              ? "Ganti gambar nota"
              : "Pilih gambar nota"}
        </label>
      </div>
      {error && <Alert error>{error}</Alert>}
      {value && (
        <div className="upload-preview">
          <img src={value.url} alt="Preview lokal nota yang dipilih" />
          <div>
            <strong>{value.name}</strong>
            <span>{Math.ceil(value.size / 1024)} KB · belum diunggah</span>
          </div>
          <Button
            variant="ghost"
            aria-label="Hapus preview nota"
            onClick={() => onChange()}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
export function SampleReceipt() {
  return (
    <div className="receipt-sample">
      <strong>IDEA STORE / DEMO</strong>
      <span>BUKTI PEMBELIAN CONTOH</span>
      <span>Produk demo × 1</span>
      <span>Total: Rp2.499.000</span>
      <div className="receipt-watermark" aria-hidden="true">
        CONTOH
      </div>
      <small>BUKAN BUKTI TRANSAKSI · DATA SINTETIS</small>
    </div>
  );
}
export function ReceiptDisplay({
  id,
  sample = false,
}: {
  id: string;
  sample?: boolean;
}) {
  const { receipts } = useDemo();
  const [open, setOpen] = useState(false);
  const receipt = receipts[id];
  return (
    <>
      <section className="panel receipt-section">
        <h2>Bukti pembelian</h2>
        {receipt || sample ? (
          <button
            className="receipt-thumb"
            aria-label="Perbesar preview bukti pembelian"
            onClick={() => setOpen(true)}
          >
            {receipt ? (
              <img src={receipt.url} alt="Preview nota lokal" />
            ) : (
              <SampleReceipt />
            )}
          </button>
        ) : (
          <div className="upload-zone">
            <FileImage size={26} />
            <p>
              Belum ada preview nota.
              <br />
              Preview lokal tidak tersedia lagi setelah refresh.
            </p>
          </div>
        )}
        <p>
          {sample && !receipt
            ? "Nota ini contoh sintetis. Preview gambar yang Anda pilih sendiri tidak disimpan setelah refresh."
            : "Gambar hanya dipreview di perangkat. Tidak diunggah dan tidak disimpan setelah refresh."}
        </p>
      </section>
      <Dialog
        open={open}
        title={receipt ? "Preview nota lokal" : "Bukti pembelian contoh"}
        onClose={() => setOpen(false)}
      >
        {receipt ? (
          <img
            className="receipt-zoom"
            src={receipt.url}
            alt="Preview nota lokal diperbesar"
          />
        ) : (
          <SampleReceipt />
        )}
      </Dialog>
    </>
  );
}
