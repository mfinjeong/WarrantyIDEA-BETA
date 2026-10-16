"use client";
import Link from "next/link";
import { useState } from "react";
import { LogOut, RotateCcw, Save } from "lucide-react";
import {
  Alert,
  Button,
  ConfirmDialog,
  Field,
  PageHeading,
  Skeleton,
} from "@/components/ui";
import { ModeSwitcher } from "@/components/layout/shell";
import { useDemo } from "@/lib/demo/provider";

export function ProfilePage({ admin = false }: { admin?: boolean }) {
  const { state } = useDemo();
  if (!state) return <Skeleton />;
  return (
    <ProfileForm
      key={`${state.profile.name}-${state.profile.reminders}`}
      admin={admin}
    />
  );
}
function ProfileForm({ admin }: { admin: boolean }) {
  const { state, repository } = useDemo();
  const [name, setName] = useState(state!.profile.name);
  const [enabled, setEnabled] = useState(state!.profile.reminders);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reset, setReset] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="RUANG KERJA ANDA"
        title={admin ? "Profil admin" : "Profil saya"}
        description="Sedikit tentang ruang kerja demo Anda."
      />
      <div className="profile-grid">
        <section className="panel profile-form">
          <div className="profile-avatar">
            <span className="avatar">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <h2>{state!.profile.name}</h2>
              <p>
                {admin ? "Admin" : "Pembeli"} · Mode demo, bukan akun produksi
              </p>
            </div>
          </div>
          <Alert>
            Gunakan nama tampilan fiktif. Email di bawah adalah contoh dan tidak
            dapat diubah.
          </Alert>
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (name.trim().length < 2 || name.trim().length > 60) {
                setError("Nama harus 2–60 karakter.");
                document.getElementById("profile-name")?.focus();
                return;
              }
              setBusy(true);
              try {
                await repository.updateProfile(name, enabled);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Profil gagal disimpan.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field id="profile-name" label="Nama tampilan demo" error={error}>
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoComplete="nickname"
                aria-invalid={!!error}
                aria-describedby="profile-name-help"
              />
            </Field>
            <Field id="profile-email" label="Email contoh">
              <input
                id="profile-email"
                readOnly
                value={admin ? "admin@example.test" : "alex@example.test"}
                type="email"
              />
            </Field>
            <label className="check-label" htmlFor="reminders">
              <input
                id="reminders"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>
                <strong>Tampilkan pengingat demo</strong>
                <br />
                Pengingat hanya dibuat secara lokal saat aplikasi dimuat atau
                data diubah. Tidak ada email atau push notification.
              </span>
            </label>
            <Button className="mt-6" type="submit" busy={busy}>
              <Save size={16} />
              Simpan profil
            </Button>
          </form>
        </section>
        <section className="panel demo-settings">
          <span className="eyebrow">JELAJAHI DEMO</span>
          <h2>Jelajahi sisi lainnya.</h2>
          <p>
            Pembeli dan admin memakai data demo yang sama. Perpindahan mode
            tidak memerlukan login.
          </p>
          <ModeSwitcher />
          <Link href="/" className="btn btn-secondary">
            <LogOut size={16} />
            Keluar demo
          </Link>
          <Button variant="ghost" onClick={() => setReset(true)}>
            <RotateCcw size={16} />
            Reset data demo
          </Button>
          <p className="helper">
            Reset mengembalikan seluruh metadata fiktif, notifikasi, dan
            preferensi. Preview lokal juga dihapus.
          </p>
        </section>
      </div>
      <ConfirmDialog
        open={reset}
        title="Mulai ulang demo?"
        description="Seluruh perubahan metadata fiktif dan preview lokal di browser ini akan dihapus, lalu data contoh dimuat kembali."
        onClose={() => setReset(false)}
        onConfirm={() => repository.reset()}
        label="Reset data demo"
      />
    </>
  );
}
