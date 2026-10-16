import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Check,
  CheckCircle2,
  FileImage,
  Layers3,
  Package,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { ActionLink, Logo } from "@/components/ui";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function Landing() {
  return (
    <>
      <MarketingHeader />
      <main id="main">
        <section className="landing-hero marketing-container">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Satu tempat untuk semua garansi
            </span>
            <h1>
              Garansi tersimpan.
              <br />
              Pikiran lebih <span className="lime-underline">tenang.</span>
            </h1>
            <p>
              Barang boleh banyak. Urusan garansi tetap sederhana. Simpan detail
              produk, rapikan bukti pembelian, dan pantau masa berlakunya dalam
              satu tempat.
            </p>
            <div className="button-row">
              <ActionLink href="/app">
                Coba demo pembeli <ArrowRight size={18} />
              </ActionLink>
              <ActionLink href="#cara-kerja" secondary>
                Lihat cara kerja <ArrowDown size={17} />
              </ActionLink>
            </div>
            <div className="hero-footnote">
              <span>
                <Check size={15} /> Tanpa membuat akun
              </span>
              <Link href="/admin">
                Jelajahi demo admin{" "}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div
            className="archive-scene"
            aria-label="Ilustrasi arsip garansi dengan data produk contoh"
          >
            <div className="scene-grid" />
            <span className="scene-corner">
              BARANG ANDA.
              <br />
              SEMUA TERTATA.
            </span>
            <div className="archive-back archive-back-one" />
            <div className="archive-back archive-back-two" />
            <div className="archive-card">
              <div className="archive-top">
                <span>
                  <Package size={16} /> ARSIP GARANSI
                </span>
                <span>001 / IDEA</span>
              </div>
              <div className="headphones">
                <div className="headphone-band" />
                <div className="ear ear-left" />
                <div className="ear ear-right" />
              </div>
              <div className="archive-product">
                <div>
                  <span className="tiny-label">SONIC · QUIET 700</span>
                  <h3>
                    Suara favorit.
                    <br />
                    Tetap terlindungi.
                  </h3>
                </div>
                <span className="archive-document" aria-hidden="true">
                  <FileImage size={20} />
                </span>
              </div>
              <div className="archive-footer">
                <div>
                  <span className="tiny-label">MASA BERLAKU CONTOH</span>
                  <strong>12 bulan garansi</strong>
                </div>
                <span className="badge badge-active">
                  <CheckCircle2 size={13} />
                  Aktif
                </span>
              </div>
            </div>
            <div className="floating-label">
              <span className="floating-icon">
                <ShieldCheck size={24} />
              </span>
              <div>
                <strong>Satu arsip. Semua detail.</strong>
                <span>Rapi sampai nanti.</span>
              </div>
            </div>
          </div>
        </section>
        <section id="manfaat" className="benefit-strip">
          <div className="marketing-container benefit-grid">
            {[
              [
                Layers3,
                "Bukan lagi mencari-cari",
                "Semua garansi, satu arsip yang rapi.",
              ],
              [
                FileImage,
                "Nota punya tempatnya",
                "Preview bukti pembelian di perangkat.",
              ],
              [
                BellRing,
                "Tanggal tak terlewat",
                "Masa berlaku terlihat lebih jelas.",
              ],
            ].map(([Icon, title, copy]) => (
              <div className="benefit" key={String(title)}>
                <span className="benefit-icon">
                  {typeof Icon !== "string" && <Icon size={23} />}
                </span>
                <div>
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section id="fitur" className="marketing-container landing-section">
          <div className="section-intro">
            <div>
              <span className="eyebrow">DETAIL KECIL, BEDANYA BESAR</span>
              <h2>
                Setiap barang punya cerita.
                <br />
                Dan tempat untuk garansinya.
              </h2>
            </div>
            <p>
              Mulai dari headphone sehari-hari sampai perangkat andalan di
              rumah. Kelola semuanya dengan lebih teratur.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-panel">
              <span className="feature-number">01 / SIMPAN</span>
              <Package size={32} />
              <h3>
                Arsip yang tahu
                <br />
                apa yang penting.
              </h3>
              <p>
                Produk, nomor seri, toko, dan tanggal garansi. Detail lengkap
                tanpa tumpukan kertas.
              </p>
              <div className="mini-record">
                <span className="mini-product">
                  <Package size={22} />
                </span>
                <div>
                  <strong>Air purifier</strong>
                  <span>Aera · Pure 2</span>
                </div>
                <span className="badge badge-active">Aktif</span>
              </div>
            </article>
            <article className="feature-panel">
              <span className="feature-number">02 / RAPIKAN</span>
              <FileImage size={32} />
              <h3>
                Bukti pembelian,
                <br />
                mudah dilihat kembali.
              </h3>
              <p>
                Pilih gambar nota untuk preview lokal. Pada demo ini, dokumen
                tidak diunggah atau disimpan.
              </p>
              <span className="feature-tag">PREVIEW LOKAL</span>
            </article>
            <article className="feature-panel">
              <span className="feature-number">03 / PANTAU</span>
              <BellRing size={32} />
              <h3>
                Lebih dekat dengan
                <br />
                tanggal yang penting.
              </h3>
              <p>
                Status aktif, segera berakhir, dan kedaluwarsa membantu
                menentukan prioritas.
              </p>
              <span className="feature-tag">PENGINGAT DEMO LOKAL</span>
            </article>
            <article className="feature-panel">
              <span className="feature-number">04 / JELAJAHI</span>
              <ScanLine size={32} />
              <h3>
                Bayangkan scan.
                <br />
                Coba alurnya sekarang.
              </h3>
              <p>
                Jelajahi simulasi QR, barcode, dan pembacaan nota. Kamera dan
                OCR belum diimplementasikan.
              </p>
              <Link href="/app/scan" className="text-link">
                Coba scan demo <ArrowRight size={17} />
              </Link>
            </article>
          </div>
        </section>
        <section id="cara-kerja" className="how-section">
          <div className="marketing-container">
            <span className="eyebrow">DARI BELI KE TERARSIP</span>
            <h2>
              Tiga langkah.
              <br />
              Lebih sedikit yang dipikirkan.
            </h2>
            <div className="steps">
              {[
                [
                  "01",
                  "Tambahkan produk",
                  "Masukkan produk secara manual atau jelajahi hasil scan simulasi.",
                ],
                [
                  "02",
                  "Lengkapi detailnya",
                  "Isi tanggal, nomor seri, dan pilih preview bukti pembelian.",
                ],
                [
                  "03",
                  "Pantau dari satu tempat",
                  "Lihat masa berlaku dan kelola arsip kapan pun di demo ini.",
                ],
              ].map(([number, title, copy]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="marketing-container final-cta">
          <div>
            <span className="eyebrow">RAPI MULAI HARI INI</span>
            <h2>
              Beri garansi Anda
              <br />
              tempat yang <em>semestinya.</em>
            </h2>
            <p>Jelajahi WarrantyIDEA dengan data contoh. Tanpa akun.</p>
          </div>
          <ActionLink href="/app">
            Mulai jelajahi demo <ArrowRight size={18} />
          </ActionLink>
        </section>
      </main>
      <footer className="marketing-footer marketing-container">
        <Logo />
        <p>Arsip kecil. Rasa tenang yang lebih besar.</p>
        <div>
          <Link href="#fitur">Fitur</Link>
          <Link href="/admin">Demo admin</Link>
          <span>Frontend demo · © 2026 WarrantyIDEA</span>
        </div>
      </footer>
    </>
  );
}
