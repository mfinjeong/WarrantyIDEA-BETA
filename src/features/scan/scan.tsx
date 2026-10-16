"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Barcode, QrCode, ScanLine } from "lucide-react";
import { Alert, Button, PageHeading, Tabs } from "@/components/ui";
import { ReceiptUpload } from "@/features/warranties/receipt";
import { useDemo } from "@/lib/demo/provider";

export function ScanPage() {
  const { receipts, setReceipt, moveReceipt, setDraft } = useDemo();
  const [tab, setTab] = useState("qr");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(false);
  const router = useRouter();
  async function simulate() {
    setBusy(true);
    setResult(false);
    await new Promise((r) => setTimeout(r, 450));
    setResult(true);
    setBusy(false);
  }
  return (
    <>
      <PageHeading
        eyebrow="CARA CEPAT UNTUK MEMULAI"
        title="Scan demo"
        description="Jelajahi cara lain untuk memulai arsip garansi."
      />
      <Alert>
        Simulasi scan. Kamera dan OCR belum diimplementasikan; gambar hanya
        dipreview di perangkat ini.
      </Alert>
      <div className="scan-grid">
        <section className="panel scan-panel">
          <Tabs
            items={[
              { value: "qr", label: "QR code" },
              { value: "barcode", label: "Barcode" },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setResult(false);
            }}
          />
          <div
            role="tabpanel"
            aria-label={tab === "qr" ? "Simulasi QR code" : "Simulasi barcode"}
          >
            <div className="camera-demo">
              {tab === "qr" ? (
                <QrCode size={96} strokeWidth={1.2} />
              ) : (
                <Barcode size={112} strokeWidth={1.2} />
              )}
              <span>FRAME ILUSTRASI / BUKAN KAMERA AKTIF</span>
              <Button onClick={simulate} busy={busy}>
                <ScanLine size={18} />
                Simulasikan hasil {tab === "qr" ? "QR" : "Barcode"}
              </Button>
            </div>
            <p className="scan-description">
              Gunakan tombol untuk melihat data contoh. Tidak ada pemindaian
              atau akses kamera.
            </p>
          </div>
        </section>
        <section className="panel scan-panel">
          <div className="section-heading">
            <div>
              <h2>Mulai dari gambar nota</h2>
              <p>Preview lokal, tanpa upload ke server.</p>
            </div>
          </div>
          <ReceiptUpload
            value={receipts.__scan}
            onChange={(r) => {
              setReceipt("__scan", r);
              setResult(false);
            }}
          />
          <Button
            className="w-full mt-5"
            variant="secondary"
            disabled={!receipts.__scan}
            busy={busy}
            onClick={simulate}
          >
            Simulasikan pembacaan nota
          </Button>
        </section>
      </div>
      {result && (
        <section className="panel scan-result" aria-live="polite">
          <span className="eyebrow">HASIL SIMULASI</span>
          <h2>Data contoh siap dilengkapi.</h2>
          <Alert>
            Data contoh, bukan hasil pembacaan gambar. Periksa dan lengkapi
            detail sebelum menyimpan.
          </Alert>
          <dl className="info-grid">
            {[
              ["Produk", "Headphone wireless"],
              ["Merek / model", "Sonic · Quiet 700"],
              ["Nomor seri", `DEMO-SCAN-${tab.toUpperCase()}`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="button-row">
            <Button
              onClick={() => {
                setDraft({
                  productName: "Headphone wireless",
                  brand: "Sonic",
                  model: "Quiet 700",
                  serialNumber: `DEMO-SCAN-${tab.toUpperCase()}`,
                  category: "electronics",
                });
                if (receipts.__scan) moveReceipt("__scan", "__form");
                router.push("/app/warranties/new");
              }}
            >
              Gunakan data contoh <ArrowRight size={17} />
            </Button>
            <Button variant="secondary" onClick={() => setResult(false)}>
              Ulangi
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
