# WarrantyIDEA — panduan pengembangan

## Status dan ruang lingkup

Project ini dimulai dari folder kosong. Tahap awal hanya menetapkan dokumentasi; jangan menganggap Next.js atau tooling sudah tersedia. Implementasi UI dilakukan pada tahap berikutnya setelah acuan desain selesai.

WarrantyIDEA adalah demo frontend pengelolaan garansi dengan dua antarmuka: pembeli dan admin. Gunakan Next.js App Router, TypeScript strict, Tailwind CSS, Plus Jakarta Sans, dan ikon Lucide. Semua konten produk menggunakan bahasa Indonesia dan data fiktif.

## Sumber acuan

- Baca `DESIGN_SYSTEM.md` untuk token visual, komponen, aksesibilitas, dan motion.
- Baca `UI_SPEC.md` untuk rute, isi halaman, state, perilaku, dan acceptance criteria.
- Ikuti instruksi pengguna terbaru jika ada konflik. Saat mengubah keputusan desain, perbarui dokumentasi terkait agar implementasi tetap sinkron.
- Tinjau file yang ada sebelum mengubahnya. Jangan menghapus atau menimpa pekerjaan lain tanpa alasan yang jelas.

## Batas implementasi

- Frontend saja: tidak ada database, Supabase, API routes, server actions untuk mutasi, autentikasi nyata, role produksi, secret, atau API key.
- Pemilih mode pembeli/admin adalah navigasi demo yang terbuka. Tampilkan label demo dan jangan mengklaim rute admin terlindungi.
- Scan QR/barcode dan OCR adalah simulasi eksplisit. Jangan meminta akses kamera atau mengklaim pemindaian bekerja.
- Upload nota hanya preview lokal melalui object URL. Jangan upload, menyimpan file/base64/object URL ke localStorage, atau mengirimnya ke analytics.
- Jangan menyimpan password, token, email pribadi, atau dokumen sensitif. Form login/registrasi hanya validasi demo dan membuang isian kredensial setelah submit.
- Tidak perlu layanan atau library backend untuk menampilkan data mock.

## Struktur yang dituju

```text
src/app/                  # Rute App Router, layout, loading, not-found
src/components/ui/        # Button, Field, Dialog, Toast, Badge, dll.
src/components/layout/    # MarketingHeader, BuyerShell, AdminShell
src/features/warranties/  # Tipe, form, daftar, detail, selectors
src/features/catalog/     # Katalog admin
src/features/scan/        # State simulasi dan preview
src/features/notifications/
src/features/profile/
src/lib/demo/             # Fixtures, repository lokal, provider, migrasi storage
src/lib/                 # Format tanggal, uang, utility bersama
```

Jangan membuat abstraksi untuk direktori kosong sebelum diperlukan. Gunakan komponen server secara default untuk struktur statis; tempatkan state, browser API, dan event handler di client boundary yang kecil. Jangan mengakses localStorage saat render server.

## Standar kode dan dependensi

- Hindari `any`; definisikan model dan union status eksplisit. Pisahkan status masa berlaku dari status peninjauan.
- Gunakan satu repository demo dengan operasi async terstruktur agar kelak mudah diganti adapter backend. Jangan menyebar akses localStorage ke komponen.
- Form memakai model terkontrol dan validasi client yang reusable. Gunakan HTML native bila cukup; dependency form/schema hanya jika manfaatnya jelas.
- Tambahkan dependency hanya dengan alasan terdokumentasi. Lucide diperlukan untuk ikon; Plus Jakarta Sans melalui font lokal atau `next/font` sesuai kesiapan build.
- Jangan menambahkan chart library untuk statistik sederhana. Jangan membuat endpoint untuk fixture lokal.
- Gunakan token semantik, bukan warna dan ukuran ad hoc. Seluruh varian Button, Badge, Input, dan Dialog berasal dari komponen bersama.
- Format tanggal tampilan `id-ID`, mata uang IDR. Simpan tanggal kalender sebagai `YYYY-MM-DD`; bandingkan tanggal kalender, hindari pergeseran timezone akibat parsing UTC.
- Gunakan `Link` untuk navigasi dan `button` untuk aksi. Setiap kontrol ikon punya accessible name.

## Workflow dan verifikasi

1. Periksa struktur, package manager, script, dan instruksi lokal sebelum implementasi. Pertahankan lockfile yang dipakai project.
2. Bangun token dan komponen dasar, shell, repository demo, lalu rute sesuai `UI_SPEC.md`.
3. Verifikasi alur pembeli dan admin, CRUD, reset demo, validasi, pencarian/filter, dialog, scan simulasi, serta preview nota.
4. Periksa visual pada lebar 375, 768, dan 1440 px, ditambah reflow 320 px. Tidak boleh ada overflow halaman.
5. Uji keyboard, focus return, Escape, label, error, dan reduced motion.
6. Jalankan typecheck, lint, dan production build sesuai konfigurasi yang dibuat. Laporkan command dan hasil sebenarnya; jangan mengklaim sudah diuji jika belum.
7. Saat implementasi selesai, buat README berisi instalasi, cara menjalankan, script verifikasi, rute demo, reset data, dan semua batas simulasi.

Tidak perlu membuat test suite untuk dokumen. Pada implementasi, prioritaskan pengujian bermakna untuk perhitungan masa berlaku, validasi tanggal, persistensi, dan alur utama.
