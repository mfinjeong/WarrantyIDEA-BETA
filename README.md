# WarrantyIDEA

Arsip garansi pribadi berbasis **Next.js App Router + TypeScript**, PostgreSQL 18.6, Prisma, Zod, dan Better Auth. UI berbahasa Indonesia yang sudah ada dipertahankan: dashboard, arsip garansi, katalog/tinjauan admin, notifikasi, profil, dan alur scan simulasi.

## Status dan batas keamanan

- Login/registrasi memakai akun dan sesi server, bukan pemilih mode demo. Data bisnis dibaca/diubah lewat Route Handlers dan database, bukan localStorage.
- Pengguna hanya dapat membaca/mengubah garansinya sendiri. Area katalog/tinjauan admin memerlukan role admin yang ditetapkan server/administrator, bukan input registrasi.
- Password di-hash dengan Argon2id; session cookie HttpOnly, SameSite dan Secure untuk deployment HTTPS. Input divalidasi server-side; mutasi dibatasi Origin yang sah.
- **Database existing `webapp_db` tidak otomatis dimigrasikan.** Inspeksi schema, backup, kredensial, dan persetujuan operasional dibutuhkan sebelum rollout. Verifikasi lokal: lint/typecheck lolos; 23 tes lolos dan 8 tes database dilewati tanpa konfigurasi database test terisolasi.
- Tidak ada commit/push, perubahan identitas Git, publikasi port, atau perubahan firewall otomatis.

## Persiapan

Node.js 24 LTS, npm, Git, PostgreSQL 18.6. Gunakan lockfile.

```powershell
Set-Location C:\Users\Administrator\Projects\WarrantyIDEA-BETA
npm ci
Copy-Item .env.example .env.local
```

Edit `.env.local` **di VPS, bukan di chat**, dengan DATABASE_URL role runtime, BETTER_AUTH_SECRET acak, BETTER_AUTH_URL yang sesuai, dan APP_TIMEZONE. Jangan commit file `.env*` selain `.env.example`. Untuk development lokal saja gunakan origin tepat `http://127.0.0.1:3000`; production wajib HTTPS.

Schema dan role khusus berada di namespace `warrantyidea`. Provisioning harus memisahkan role migrasi/runtime dan menyertakan backup serta peninjauan migrasi sebelum deployment. Jangan menjalankan `migrate reset`, `db push --accept-data-loss`, atau seed demo pada database existing.

Setelah database/schema diprovision dan migrasi ditinjau/diterapkan dengan role migrasi:

```powershell
node --env-file=.env.local node_modules/prisma/build/index.js generate
npm run dev
```

Aplikasi development/start hanya listen pada loopback `127.0.0.1`. Rute `/register` membuat akun pembeli; akun admin harus ditetapkan melalui proses administratif yang disetujui.

## Fitur dan rute

- Publik: `/`, `/login`, `/register`, `/admin/login`.
- Pembeli terautentikasi: `/app`, `/app/warranties`, `/app/warranties/new`, `/app/warranties/[id]`, `/app/warranties/[id]/edit`, `/app/notifications`, `/app/profile`, `/app/scan`.
- Admin terotorisasi: `/admin`, `/admin/catalog`, `/admin/reviews`, `/admin/reviews/[id]`, `/admin/notifications`, `/admin/profile`.
- Pencarian, filter kategori/status, sorting dan pagination API; status kalender aktif, segera berakhir (0–30 hari), kedaluwarsa, terpisah dari keputusan review.
- Profil/preferensi pengingat, notifikasi, aktivitas tinjauan, dan statistik berasal dari database.

API aplikasi menggunakan envelope `{data: ...}` atau `{error: {code, message}}`; endpoint Better Auth menggunakan format native library. Konfigurasi environment tersedia di `.env.example`.

## Pemeriksaan

```powershell
npm run lint
npm run typecheck
npm test
node --env-file=.env.local node_modules/next/dist/bin/next build
node node_modules/playwright/cli.js install chromium
```

Database-writing integration/browser tests harus memakai **database test terisolasi**, bukan `webapp_db` production. Suite HTTP `tests/http-integration.mjs` memerlukan opt-in `ALLOW_ISOLATED_HTTP_TESTS=1`, loopback API, dan URL database test yang lolos guard. Jangan menjalankannya pada production. Jalankan hanya setelah database test terisolasi tersedia dan aksesnya diverifikasi.

## Batas fitur yang tetap eksplisit

- Kamera, QR/barcode dan OCR masih simulasi berlabel, bukan ekstraksi nyata.
- Gambar nota hanya preview lokal dalam memori; tidak diunggah atau dipersist, hilang setelah reload. Metadata pembelian/garansi dipersist di PostgreSQL.
- Notifikasi pengingat dalam aplikasi tidak sama dengan scheduler email/push. Tidak mengklaim pengiriman email tanpa provider dan konfigurasi.
- Data localStorage demo lama tidak diimpor otomatis: identitas pemiliknya tidak bisa diverifikasi. Tidak ada reset/seed browser yang menghapus data production.
- Keputusan review bukan bukti keaslian produk/dokumen.

## Struktur

- `src/app/api`: Route Handlers autentikasi dan API aplikasi.
- `src/lib/server`: database, sesi/otorisasi, validasi, layanan dan pemetaan DTO.
- `prisma`: schema, migrasi SQL, generated client melalui Prisma.
- `src/lib/demo/provider.tsx`: adapter konteks UI yang kini memanggil API; nama historis dipertahankan agar perubahan presentasi minimal.
- `src/features`, `src/components`: UI yang sudah ada dan integrasi state/auth.
- `src/lib/demo/fixtures.ts`, `storage.ts`: utilitas legacy/test, bukan sumber data business runtime.
- `deploy`: template provisioning non-destruktif dan runner production loopback-only.
- `tests`: unit/domain/backend, HTTP terisolasi, dan browser.

## Production

Sebelum deployment, siapkan backup, tinjau migrasi, jalankan build dan verifikasi integrasi; gunakan least-privilege service account, reverse proxy HTTPS, dan konfigurasi firewall yang disetujui. Jangan expose port Node 3000 atau PostgreSQL 5432 ke internet. Persetujuan diperlukan sebelum perubahan konfigurasi penting atau publikasi.
