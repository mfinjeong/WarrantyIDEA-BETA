# WarrantyIDEA

Website konsep layanan purnajual berbahasa Indonesia, dibuat dengan Next.js, React, dan CSS. Proyek ini **frontend-only**: hasil build adalah HTML, CSS, JavaScript, dan aset lokal.

Tidak ada akun, autentikasi, dashboard privat, API aplikasi, unggah dokumen, atau penyimpanan klaim. Alur pada halaman adalah konsep produk, bukan layanan pengajuan klaim yang sudah beroperasi. Penghapusan kode backend tidak mengubah database maupun data yang sudah ada di luar repositori.

## Tampilan dan batas proyek

- Landing editorial forest/mint dengan nota berperforasi, anotasi foto servis, label tanggapan garansi, dan monogram WI yang digambar khusus.
- Penjelasan manfaat, alur penanganan, dan peran pembeli, pemberi garansi, serta mitra servis.
- Navigasi responsif dan FAQ native yang tetap dapat dibuka tanpa JavaScript.
- Satu handoff native SVG/CSS/WAAPI berdurasi 4,4 detik: bukti berpindah, jalur tersambung, pemeriksaan dianotasi, lalu alasan penanganan ditegaskan. Otomatis sekali saat terlihat; tersedia tombol putar ulang/hentikan tanpa menu demo atau dashboard palsu.
- Motion dijeda saat grafis keluar viewport atau tab tersembunyi, dibatalkan saat preferensi reduced-motion berubah, saat resize, dan saat komponen dilepas. Semua informasi tersedia sejak HTML awal; mobile memakai rantai vertikal, bukan SVG desktop yang dikecilkan.
- Backend aplikasi, Prisma, autentikasi, dan rute akun/admin telah dihapus dari versi ini. Database eksternal beserta data lamanya tidak dihapus atau diakses oleh website.

Website: https://warranty-idea-beta.vercel.app/

## Menjalankan lokal

Gunakan Node.js yang didukung Next.js dan npm. Tidak diperlukan file environment, kredensial, atau server database.

```sh
npm ci
npm run dev
```

Development tersedia di `http://127.0.0.1:3000`.

## Build dan preview statis

```sh
npm run build
npm run preview
```

Hasil ekspor berada di `out/`. Preview hanya menyajikan berkas statis di `http://127.0.0.1:3002`, bukan backend aplikasi. `npm start` adalah alias preview. Gambar memakai aset lokal tanpa layanan optimasi gambar server.

## Pemeriksaan

```sh
npm test
npm run lint
npm run typecheck
npm run test:browser
```

`npm test` menguji batas arsitektur frontend-only. Suite browser membangun ekspor lalu menguji preview statis, bukan server development. Instal browser sekali dengan `npx playwright install chromium` bila belum tersedia. Untuk preview yang sudah berjalan, gunakan `UI_QA_URL` atau `PLAYWRIGHT_BASE_URL`; konfigurasi tidak memulai server lokal ketika override diberikan.

## Struktur

- `src/app/`: halaman publik dan CSS global.
- `src/components/`: komponen presentasi.
- `public/`: aset lokal dan informasi lisensi.
- `tests/static-architecture.test.mjs`: regresi arsitektur statis.
- `tests/browser/`: pemeriksaan browser halaman publik.
- `out/`: hasil build, tidak disimpan di Git.

## Publikasi

Publikasikan isi `out/` ke hosting statis. `vercel.json` menyatakan direktori keluaran statis. Tidak ada migrasi, provisioning, atau konfigurasi secret. Jangan menyalin file environment lokal ke hosting statis.

## Kredit aset

Fotografi oleh [IT services EU](https://www.pexels.com/@it-services-eu-9278798/), digunakan berdasarkan [Pexels License](https://www.pexels.com/license/):

- [A Man Fixing a Laptop](https://www.pexels.com/photo/a-man-fixing-a-laptop-7639370/) untuk foto utama dan versi mobile.
- [Hand with Screwdriver Fixing Motherboard](https://www.pexels.com/photo/hand-with-screwdriver-fixing-motherboard-7639373/) untuk foto detail.

Gambar di-crop, diubah ukuran, dan dikompresi ke WebP secara lokal. Foto merupakan ilustrasi proses servis, bukan dokumentasi staf atau mitra WarrantyIDEA, dan tidak menyiratkan dukungan fotografer atau merek yang terlihat. Rincian sumber tersedia di `public/licenses/photography.txt` dan di footer halaman. Monogram, panah, dan objek grafis merupakan karya kode khusus dengan bantuan AI, bukan aset dari pustaka ikon. Tidak ada gambar generatif baru. Font Plus Jakarta Sans menggunakan lisensi OFL paket Fontsource.
