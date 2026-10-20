"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="missing" tabIndex={-1}>
      <p className="eyebrow">TAMPILAN BELUM DAPAT DIMUAT</p>
      <h1>Coba sekali lagi.</h1>
      <p>
        Ada masalah saat menampilkan halaman. Tidak ada data yang dikirim atau
        disimpan.
      </p>
      <button className="button" onClick={reset} type="button">
        Muat ulang tampilan
      </button>
      <a href="/">Kembali ke beranda</a>
    </main>
  );
}
