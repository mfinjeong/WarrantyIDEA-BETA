import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ClipboardCheck,
  FileSearch,
  UsersRound,
} from "lucide-react";
import { ActionLink, Logo } from "@/components/ui";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SampleArchive, Reveal } from "./sample-archive";
import "./aftersales-landing.css";

export function LandingContent() {
  return (
    <>
      <MarketingHeader />
      <main id="main" className="warranty-landing aftersales-landing">
        <section className="marketing-container archive-hero aftersales-hero">
          <div className="archive-hero-copy">
            <h1>
              Tangani laporan kerusakan <span>tanpa mengulang informasi.</span>
            </h1>
            <p>
              Pratinjau ruang kerja purnajual untuk distributor dan pemberi
              garansi. Lihat bagaimana pembeli, petugas, dan mitra servis
              melanjutkan satu kasus dengan bukti serta langkah berikutnya yang
              jelas.
            </p>
            <div className="button-row">
              <ActionLink href="#contoh-arsip">
                Jelajah demo kasus <ArrowDown size={18} aria-hidden="true" />
              </ActionLink>
              <ActionLink href="#cara-kerja" secondary>
                Rencana uji coba <ArrowRight size={17} aria-hidden="true" />
              </ActionLink>
            </div>
            <p className="b2b-scope">
              Kolaborasi organisasi belum aktif. Demo memakai data fiktif; akun
              saat ini masih untuk arsip pribadi.
            </p>
            <p className="archive-hero-note">
              Sudah punya akun?{" "}
              <Link href="/login">Masuk ke arsip pribadi</Link>
            </p>
          </div>
          <SampleArchive />
        </section>
        <section
          id="fitur"
          className="marketing-container archive-features aftersales-roles"
        >
          <Reveal className="archive-feature-intro">
            <h2>Siapa yang melanjutkan kasus ini?</h2>
            <p>
              Setiap perpindahan perlu penanggung jawab, bukti, dan tindakan
              berikutnya. Bukan hanya label “sedang diproses”.
            </p>
            <p className="role-scope">
              Contoh pembagian peran dalam demo. Akses organisasi masih
              direncanakan.
            </p>
          </Reveal>
          <div className="archive-feature-rows">
            <article className="archive-feature-row">
              <span>Pemberi garansi</span>
              <div>
                <h3>Periksa kelengkapan, lalu tentukan penanganan.</h3>
                <p>
                  Petugas mengumpulkan bukti, menunjuk pemeriksa, dan mencatat
                  keputusan pihak berwenang beserta alasannya. Menerima laporan
                  tidak berarti langsung menyetujui klaim.
                </p>
              </div>
            </article>
            <article className="archive-feature-row">
              <span>Mitra servis</span>
              <div>
                <h3>Lanjutkan pemeriksaan dengan konteks yang sama.</h3>
                <p>
                  Catat kondisi barang dan hasil pemeriksaan. Jika ada pekerjaan
                  berbayar, ajukan estimasi untuk disetujui pembeli sebelum
                  dikerjakan. Penyebab kerusakan tidak ditentukan otomatis.
                </p>
              </div>
            </article>
            <article className="archive-feature-row">
              <span>Pembeli</span>
              <div>
                <h3>Lihat perkembangan dan konfirmasi hasilnya.</h3>
                <p>
                  Ketahui informasi yang masih diperlukan, siapa yang menangani,
                  serta alasan keputusan. Pembeli dapat menyampaikan jika
                  masalah belum selesai, bukan sekadar menerima penutupan kasus.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section id="cara-kerja" className="archive-how aftersales-pilot">
          <div className="marketing-container">
            <div className="pilot-heading">
              <h2>Mulai uji coba dari satu alur yang nyata.</h2>
              <p>
                Libatkan organisasi dan mitra yang sudah bekerja sama. Telusuri
                kasusnya, sepakati pembagian peran, lalu ukur apakah alur ini
                benar-benar membantu pekerjaan sehari-hari.
              </p>
            </div>
            <ol className="pilot-steps">
              <li>
                <span className="pilot-number">
                  01 <UsersRound size={23} aria-hidden="true" />
                </span>
                <h3>Pilih petugas dan mitra.</h3>
                <p>
                  Petakan siapa yang menerima barang, memeriksa, memutuskan, dan
                  menyetujui biaya. Tanggung jawab tidak otomatis dibebankan ke
                  toko.
                </p>
              </li>
              <li>
                <span className="pilot-number">
                  02 <FileSearch size={23} aria-hidden="true" />
                </span>
                <h3>Telusuri kasus bersama.</h3>
                <p>
                  Mulai dengan contoh atau data yang sudah disamarkan. Periksa
                  apakah bukti dan serah-terima cukup untuk melanjutkan
                  pekerjaan.
                </p>
              </li>
              <li>
                <span className="pilot-number">
                  03 <ClipboardCheck size={23} aria-hidden="true" />
                </span>
                <h3>Ukur manfaatnya.</h3>
                <p>
                  Bandingkan waktu administrasi, pertanyaan status berulang, dan
                  kasus tanpa penanggung jawab. Kesediaan membayar perlu diuji,
                  bukan diasumsikan.
                </p>
              </li>
            </ol>
            <p className="archive-demo-note">
              Batas demo: tidak mengunggah bukti, mengirim kasus nyata,
              menentukan penyebab kerusakan, atau menjamin klaim diterima.
              Riwayat simulasi tidak menjadi bukti layanan resmi.
            </p>
          </div>
        </section>
        <section className="marketing-container archive-close aftersales-close">
          <div>
            <h2>Ingin mencoba fitur yang sudah tersedia?</h2>
            <p>
              Buat akun pembeli untuk mencatat produk dan masa garansi pribadi.
              Kolaborasi kasus dan penyimpanan gambar nota permanen belum
              tersedia.
            </p>
          </div>
          <ActionLink href="/register">
            Coba arsip pribadi <ArrowRight size={18} aria-hidden="true" />
          </ActionLink>
        </section>
      </main>
      <footer className="marketing-footer marketing-container">
        <Logo />
        <p>Garansi jelas, penanganan terlacak.</p>
        <div>
          <Link href="#fitur">Peran pengguna</Link>
          <Link href="/admin/login">Masuk admin</Link>
          <span>© 2026 WarrantyIDEA</span>
        </div>
      </footer>
    </>
  );
}
