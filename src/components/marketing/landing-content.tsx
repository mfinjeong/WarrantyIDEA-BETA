import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { ActionLink, Logo } from "@/components/ui";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SampleArchive, Reveal } from "./sample-archive";

export function LandingContent() {
  return (
    <>
      <MarketingHeader />
      <main id="main" className="warranty-landing">
        <section className="marketing-container archive-hero">
          <div className="archive-hero-copy">
            <h1>
              Catat garansi sebelum <span>notanya hilang.</span>
            </h1>
            <p>
              Tanggal beli, nomor seri, dan masa garansi ada di sini.
              Saat barang bermasalah, tinggal cari namanya sebelum menghubungi toko.
            </p>
            <div className="button-row">
              <ActionLink href="/register">
                Catat garansi <ArrowRight size={18} />
              </ActionLink>
              <ActionLink href="#contoh-arsip" secondary>
                Lihat contoh arsip <ArrowDown size={17} />
              </ActionLink>
            </div>
            <p className="archive-hero-note">
              Punya akun? <Link href="/login">Masuk ke arsip Anda</Link>
            </p>
          </div>
          <SampleArchive />
        </section>
        <section id="fitur" className="marketing-container archive-features">
          <Reveal className="archive-feature-intro">
            <h2>
              Pas dibutuhkan,
              <br />
              detailnya ada.
            </h2>
            <p>
              Bukan pengganti kartu garansi atau layanan klaim. Ini tempat untuk
              mencatat informasi yang biasanya tercecer.
            </p>
          </Reveal>
          <div className="archive-feature-rows">
            <Reveal className="archive-feature-row">
              <span>Produk & pembelian</span>
              <div>
                <h3>Nomor seri tidak perlu dicari lagi.</h3>
                <p>
                  Catat model, nomor seri, toko, dan tanggal beli di detail
                  produk. Tambahkan catatan kalau ada syarat garansi yang perlu
                  diingat.
                </p>
              </div>
            </Reveal>
            <Reveal className="archive-feature-row">
              <span>Masa garansi</span>
              <div>
                <h3>Tahu mana yang perlu dicek dulu.</h3>
                <p>
                  Lihat status aktif, segera berakhir, atau kedaluwarsa di
                  aplikasi. Tanggalnya tercatat, bukan mengandalkan ingatan.
                </p>
              </div>
            </Reveal>
            <Reveal className="archive-feature-row">
              <span>Bukti pembelian</span>
              <div>
                <h3>Periksa notanya sambil mengisi.</h3>
                <p>
                  Pilih gambar untuk preview di perangkat. Gambar tidak diunggah
                  atau disimpan, jadi tetap simpan nota asli atau salinan Anda
                  sendiri.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
        <section id="cara-kerja" className="archive-how">
          <div className="marketing-container">
            <h2>
              Mulai dari satu barang
              <br />
              yang baru Anda beli.
            </h2>
            <div className="archive-steps">
              <article>
                <span>01 / CATAT</span>
                <h3>Masukkan produknya.</h3>
                <p>
                  Buat akun, lalu isi nama produk, model, dan nomor seri secara
                  manual.
                </p>
              </article>
              <article>
                <span>02 / LENGKAPI</span>
                <h3>Cek tanggal di nota.</h3>
                <p>
                  Tambahkan toko, tanggal beli, dan masa garansi. Preview nota
                  hanya bersifat lokal.
                </p>
              </article>
              <article>
                <span>03 / BUKA LAGI</span>
                <h3>Lihat saat dibutuhkan.</h3>
                <p>
                  Detail dan status garansi tersimpan di arsip akun Anda. Buka
                  lagi sebelum menghubungi toko.
                </p>
              </article>
            </div>
            <p className="archive-demo-note">
              Ingin mencoba alur scan?{" "}
              <Link href="/app/scan">
                Buka simulasi scan <ArrowRight size={15} />
              </Link>{" "}
              Kamera dan pembacaan nota otomatis (OCR) belum tersedia.
            </p>
          </div>
        </section>
        <section className="marketing-container archive-close">
          <div>
            <h2>
              Barangnya sudah dibeli.
              <br />
              Sekarang catat garansinya.
            </h2>
            <p>Siapkan nomor seri, tanggal beli, dan tanggal akhir garansinya.</p>
          </div>
          <ActionLink href="/register">
            Catat garansi pertama <ArrowRight size={18} />
          </ActionLink>
        </section>
      </main>
      <footer className="marketing-footer marketing-container">
        <Logo />
        <p>Catatan garansi untuk barang Anda.</p>
        <div>
          <Link href="#fitur">Fitur</Link>
          <Link href="/admin/login">Masuk admin</Link>
          <span>© 2026 WarrantyIDEA</span>
        </div>
      </footer>
    </>
  );
}
