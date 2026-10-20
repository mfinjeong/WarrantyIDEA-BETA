export default function NotFound() {
  return (
    <main id="main" className="missing" tabIndex={-1}>
      <a href="/" className="wordmark">
        Warranty<span>IDEA</span>
      </a>
      <p className="eyebrow">404 / HALAMAN TIDAK TERSEDIA</p>
      <h1>Halaman ini tidak ada.</h1>
      <p>
        WarrantyIDEA kini berupa website presentasi. Halaman akun, dashboard,
        dan layanan aplikasi tidak tersedia.
      </p>
      <a className="button" href="/">
        Kembali ke beranda
      </a>
    </main>
  );
}
