# WarrantyIDEA

Frontend demo pengelolaan garansi produk, dibangun dengan Next.js App Router, TypeScript strict, Tailwind CSS, Plus Jakarta Sans lokal, dan Lucide. Seluruh konten menggunakan data fiktif berbahasa Indonesia.

## Menjalankan lokal

Prasyarat: Node.js 24 LTS dan npm. Versi yang dipakai saat pengembangan: Node 24.15.0, npm 11.12.1. Gunakan lockfile yang tersedia.

```powershell
cd D:\WarrantyIDEA
npm ci
npm run dev
```

Buka http://localhost:3000. Tidak memerlukan `.env`, API key, database, atau layanan eksternal. Font disajikan dari dependency lokal, bukan Google Fonts runtime.

Untuk menjalankan production build:

```powershell
npm run build
npm start
```

## Halaman dan alur

| Area | Rute |
|---|---|
| Marketing | `/` |
| Form masuk demo | `/login`, `/register`, `/admin/login` |
| Pembeli | `/app`, `/app/warranties`, `/app/warranties/new`, `/app/warranties/[id]`, `/app/warranties/[id]/edit` |
| Utilitas pembeli | `/app/scan`, `/app/notifications`, `/app/profile` |
| Admin | `/admin`, `/admin/catalog`, `/admin/reviews`, `/admin/reviews/[id]` |
| Utilitas admin | `/admin/notifications`, `/admin/profile` |
| Pemulihan | Not-found untuk rute tak dikenal dan ID yang tidak ada |

Mulai dari landing → **Coba demo pembeli**. Tambah/edit/hapus garansi, cari dan filter arsip, lalu pindah melalui pemilih mode ke admin. Garansi baru/edit masuk antrean; keputusan admin memperbarui status tinjauan dan notifikasi pembeli pada store yang sama. Katalog mendukung tambah/edit/aktif/nonaktif. Tersedia pencarian, sorting/pagination garansi, dialog konfirmasi, tabs, toast, skeleton, empty/error states, dan validasi client.

Sidebar tampil pada desktop, bottom navigation untuk pembeli pada mobile/tablet, dan drawer untuk admin. Tabel diganti kartu di bawah 768px.

## Penyimpanan dan reset

- Key `warrantyidea:demo:v1` menyimpan metadata fiktif, katalog, nama tampilan demo, preferensi pengingat, notifikasi, dan aktivitas tinjauan.
- Storage dibaca setelah mount. Data invalid dipulihkan ke seed; storage diblokir/penuh beralih ke memori dengan pemberitahuan.
- Seed memakai tanggal kalender relatif terhadap tanggal lokal saat pertama dibuat. Aktif, segera berakhir (0–30 hari), dan kedaluwarsa dihitung terpisah dari status tinjauan.
- **Profil → Reset data demo** menghapus data aplikasi ini dan mengembalikan seed tanpa menghapus key aplikasi lain.
- Data dibagikan antara mode pembeli/admin dalam sesi aplikasi dan bertahan setelah refresh. Sinkronisasi langsung antartab tidak diimplementasikan; muat ulang tab untuk membaca perubahan yang sudah disimpan.

## Fitur simulasi dan batas implementasi

- Mode pembeli/admin **bukan autentikasi atau pembatasan akses**. Rute admin terbuka. Form masuk hanya memvalidasi isian lalu membuka demo; kredensial tidak disimpan. Registrasi hanya menyimpan nama tampilan fiktif.
- QR, barcode, dan pembacaan nota menggunakan hasil contoh deterministik. Tidak ada akses kamera, pemindaian nyata, OCR, atau ekstraksi data dari gambar.
- Gambar JPG/PNG/WebP maksimal 5 MB hanya preview melalui object URL dalam memori. Tidak diunggah dan tidak disimpan dalam localStorage. Preview hilang setelah refresh; draft form dibuang saat ditinggalkan.
- Nota seed adalah ilustrasi sintetis berlabel **CONTOH**, bukan bukti transaksi.
- Keputusan admin hanya mengubah status demo. Tidak membuktikan keaslian dokumen atau produk.
- Pengingat dibuat di browser ketika data dimuat/diubah; tidak ada background job, push, atau email.
- Gunakan data fiktif. Tidak ada backend, API routes, server actions mutasi, Supabase, secret, atau analytics.

## Struktur dan dependency

- `src/app`: rute, layout server, loading/error/not-found; route group admin memisahkan shell workspace dari login.
- `src/components`: UI reusable dan shell marketing/pembeli/admin.
- `src/features`: presentasi dan interaksi garansi, scan, katalog/tinjauan, profil, notifikasi.
- `src/lib/demo`: tipe, interface repository async, fixtures, provider bersama, dan adapter storage; `src/lib/format.ts` menangani tanggal kalender dan rupiah.
- `tests`: unit test domain/storage dan browser test alur/responsif/aksesibilitas.

Dependency runtime dibatasi pada framework React/Next, Lucide (ikon), dan Fontsource (font lokal). Tailwind/PostCSS untuk styling; ESLint/TypeScript untuk pemeriksaan; tsx untuk unit test tanpa framework tambahan; Playwright untuk browser; axe untuk audit aksesibilitas; Prettier untuk konsistensi format. Tidak memakai library chart, form, atau backend.

## Pemeriksaan

```powershell
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

Browser test memakai Chromium lokal dan menyalakan dev server otomatis jika port 3000 belum digunakan. Screenshot responsif berada di `test-results/` (diabaikan Git). Trace disimpan jika test gagal. Audit axe bukan pengganti audit aksesibilitas manual menyeluruh.

Rujukan setup: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Tailwind CSS untuk Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

Lihat `VERIFICATION.md` untuk hasil pemeriksaan aktual dan batas pengujian.

Untuk membandingkan polish UI, jalankan `node scripts/capture-polish.mjs after` saat server lokal aktif. Screenshot landing/dashboard pada lima ukuran dan data ukur disimpan di `artifacts/ui-polish/after/`. Screenshot baseline sesi polish tersedia lokal di `artifacts/ui-polish/before/`; folder artefak diabaikan Git. `PREVIEW_URL` dapat dipakai untuk memilih server lokal lain.
