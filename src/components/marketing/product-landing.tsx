/* eslint-disable @next/next/no-img-element -- Responsive, locally pre-encoded WebP images; no image server is needed by the static export. */
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileCheck2,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";

const benefits = [
  [
    "01",
    "Bukti tidak tercecer.",
    "Nota, nomor seri, dan kondisi barang menjadi titik awal yang sama. Bukan dicari ulang setiap kali petugas berganti.",
  ],
  [
    "02",
    "Tanggung jawab terlihat.",
    "Jelas siapa yang menerima laporan, siapa yang memeriksa, dan apa yang perlu dilakukan berikutnya.",
  ],
  [
    "03",
    "Keputusan ada alasannya.",
    "Hasil pemeriksaan menjadi dasar penanganan. Laporan diterima bukan berarti klaim otomatis disetujui.",
  ],
] as const;

const questions = [
  [
    "Apakah saya sudah bisa mengajukan klaim di sini?",
    "Belum. Website ini memperkenalkan konsep WarrantyIDEA. Tidak ada pengajuan klaim, akun, unggahan nota, atau penyimpanan informasi pribadi.",
  ],
  [
    "Apakah WarrantyIDEA menggantikan garansi resmi?",
    "Tidak. Ketentuan dan keputusan garansi tetap menjadi wewenang pemberi garansi. Konsep ini berfokus pada kelengkapan informasi dan kejelasan penanganan.",
  ],
  [
    "Siapa yang menanggung biaya perbaikan?",
    "Bergantung pada ketentuan garansi dan hasil pemeriksaan. Jika ada biaya di luar garansi, estimasinya perlu disampaikan untuk disetujui pembeli sebelum pekerjaan dimulai.",
  ],
  [
    "Apa yang perlu diuji sebelum produk dikembangkan?",
    "Alur kerja distributor dan mitra servis, waktu administrasi yang terpakai, serta kesediaan membayar. Manfaatnya perlu dibuktikan lewat kasus nyata, bukan hanya tampilan website.",
  ],
] as const;

export function ProductLanding() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="container hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="small-rule" /> KONSEP PLATFORM PURNAJUAL
            </p>
            <h1 id="hero-title">
              <span className="headline-lead">Barang bermasalah.</span>{" "}
              <span className="headline-main">
                Informasi jangan ikut hilang.
              </span>
            </h1>
            <p className="hero-description">
              Garansi bukan cuma tanggal kedaluwarsa. Ada bukti yang perlu
              dibaca, barang yang perlu diperiksa, dan orang yang menunggu
              kepastian.
            </p>
            <a className="button" href="#alur">
              Lihat alurnya <ArrowDown size={18} aria-hidden="true" />
            </a>
            <div className="hero-footnote">
              <span className="small-rule" />
              <p>
                Untuk pembeli, pemberi garansi,
                <br />
                dan mitra servis yang saling terhubung.
              </p>
            </div>
          </div>
          <figure className="hero-photo">
            <div className="photo-topline">
              <span>LEBIH DARI SEKADAR KARTU GARANSI</span>
              <span aria-hidden="true">↗</span>
            </div>
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet="/images/repair-workbench-small.webp"
              />
              <img
                src="/images/repair-workbench.webp"
                width={1120}
                height={1000}
                alt="Tangan teknisi membuka komponen laptop menggunakan obeng di meja kerja."
                fetchPriority="high"
                loading="eager"
                decoding="async"
              />
            </picture>
            <figcaption>
              <span>
                Periksa barangnya.
                <br />
                <strong>Jangan putus riwayatnya.</strong>
              </span>
              <span className="photo-caption-mark" aria-hidden="true">
                <Wrench size={25} strokeWidth={1.5} />
              </span>
            </figcaption>
          </figure>
        </section>

        <section
          id="manfaat"
          className="container benefits section-space"
          aria-labelledby="benefits-title"
        >
          <div className="section-intro">
            <p className="eyebrow">YANG INGIN DIBERESKAN</p>
            <h2 id="benefits-title">Waktu habis bukan cuma di meja servis.</h2>
            <p>
              Sering kali, pekerjaan ikut tersendat saat informasi harus diminta
              lagi. WarrantyIDEA dirancang untuk merapikan bagian itu.
            </p>
          </div>
          <div className="benefit-rows">
            {benefits.map(([number, title, description]) => (
              <article key={number}>
                <span className="row-number">{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="alur"
          className="flow-section"
          aria-labelledby="flow-title"
        >
          <div className="container section-space">
            <div className="flow-heading">
              <div>
                <p className="eyebrow">SATU URUTAN YANG MASUK AKAL</p>
                <h2 id="flow-title">
                  Dari laporan,
                  <br />
                  sampai ada kejelasan.
                </h2>
              </div>
              <p>
                Gambaran alur yang ingin dibangun. Tanpa keputusan otomatis,
                tanpa janji semua kerusakan ditanggung garansi.
              </p>
            </div>
            <ol className="flow-steps">
              <li>
                <div className="flow-step-top">
                  <span>01 / LAPORKAN</span>
                  <FileCheck2 size={24} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3>Mulai dari bukti.</h3>
                <p>
                  Pembeli menyiapkan identitas produk, nota, serta penjelasan
                  kendalanya.
                </p>
                <span className="flow-party">
                  Pembeli <ArrowRight size={16} aria-hidden="true" />
                </span>
              </li>
              <li>
                <div className="flow-step-top">
                  <span>02 / PERIKSA</span>
                  <Wrench size={24} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3>Lihat kondisi sebenarnya.</h3>
                <p>
                  Mitra servis memeriksa barang dan mencatat temuannya untuk
                  ditinjau pemberi garansi.
                </p>
                <span className="flow-party">
                  Mitra servis <ArrowRight size={16} aria-hidden="true" />
                </span>
              </li>
              <li>
                <div className="flow-step-top">
                  <span>03 / TENTUKAN</span>
                  <ShieldCheck size={24} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3>Sampaikan keputusan.</h3>
                <p>
                  Pemberi garansi menjelaskan penanganan, alasannya, dan biaya
                  jika memang ada.
                </p>
                <span className="flow-party">
                  Pemberi garansi <Check size={16} aria-hidden="true" />
                </span>
              </li>
            </ol>
            <p className="flow-disclaimer">
              Alur konsep, bukan layanan klaim yang sudah berjalan.
            </p>
          </div>
        </section>

        <section
          id="pengguna"
          className="container people section-space"
          aria-labelledby="people-title"
        >
          <figure className="detail-photo">
            <img
              src="/images/repair-detail.webp"
              width={800}
              height={640}
              alt="Detail tangan dengan obeng saat memeriksa motherboard laptop."
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              Foto ilustrasi proses servis. Bukan mitra atau layanan
              WarrantyIDEA.
            </figcaption>
          </figure>
          <div className="people-copy">
            <p className="eyebrow">TIGA PIHAK, KONTEKS YANG SAMA</p>
            <h2 id="people-title">Masing-masing tahu bagiannya.</h2>
            <dl>
              <div>
                <dt>Pemberi garansi</dt>
                <dd>
                  Menilai kelengkapan bukti dan menentukan penanganan sesuai
                  ketentuannya.
                </dd>
              </div>
              <div>
                <dt>Mitra servis</dt>
                <dd>
                  Memeriksa barang dengan konteks yang cukup, bukan menebak dari
                  pesan singkat.
                </dd>
              </div>
              <div>
                <dt>Pembeli</dt>
                <dd>
                  Memahami perkembangan, keputusan, serta hal yang masih perlu
                  dilengkapi.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          id="pertanyaan"
          className="container questions section-space"
          aria-labelledby="questions-title"
        >
          <div className="section-intro">
            <p className="eyebrow">BIAR TIDAK SALAH PAHAM</p>
            <h2 id="questions-title">Sebelum melangkah lebih jauh.</h2>
          </div>
          <div className="faq-list">
            {questions.map(([question, answer]) => (
              <details key={question} name="questions">
                <summary>
                  {question}
                  <span className="faq-plus" aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container closing" aria-labelledby="closing-title">
          <div>
            <p className="eyebrow">WARRANTYIDEA</p>
            <h2 id="closing-title">
              Garansi jelas.
              <br />
              Penanganan terlacak.
            </h2>
          </div>
          <div>
            <p>
              Mulai dari alur yang rapi.
              <br />
              Buktikan manfaatnya lewat pekerjaan nyata.
            </p>
            <a className="text-link" href="#manfaat">
              Kenali pendekatannya <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <footer className="container site-footer">
        <div className="footer-top">
          <a className="wordmark" href="/">
            Warranty<span className="wordmark-suffix">IDEA</span>
            <span className="wordmark-dot">.</span>
          </a>
          <p>© 2026 WarrantyIDEA</p>
          <a className="text-link" href="#main">
            Kembali ke atas <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <p className="site-scope">
          Website presentasi konsep. Tidak menerima klaim, membuat akun, atau
          menyimpan data pengunjung.
        </p>
        <details className="photo-credits">
          <summary>Sumber fotografi</summary>
          <p>
            Foto oleh{" "}
            <a
              href="https://www.pexels.com/@it-services-eu-9278798/"
              target="_blank"
              rel="noreferrer"
            >
              IT services EU
            </a>
            , Pexels.{" "}
            <a
              href="https://www.pexels.com/photo/a-man-fixing-a-laptop-7639370/"
              target="_blank"
              rel="noreferrer"
            >
              Foto utama
            </a>{" "}
            dan{" "}
            <a
              href="https://www.pexels.com/photo/hand-with-screwdriver-fixing-motherboard-7639373/"
              target="_blank"
              rel="noreferrer"
            >
              foto detail
            </a>{" "}
            digunakan dengan{" "}
            <a
              href="https://www.pexels.com/license/"
              target="_blank"
              rel="noreferrer"
            >
              Pexels License
            </a>
            , di-crop dan dikompresi. Tidak menyiratkan dukungan fotografer atau
            merek yang terlihat.
          </p>
        </details>
      </footer>
    </>
  );
}
