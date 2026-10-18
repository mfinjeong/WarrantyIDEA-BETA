"use client";

import { useState } from "react";
import { LogOut, Save } from "lucide-react";
import {
  Alert,
  Button,

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
  const { state, repository, logout } = useDemo();
  const [name, setName] = useState(state!.profile.name);
  const [enabled, setEnabled] = useState(state!.profile.reminders);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <PageHeading
        eyebrow="RUANG KERJA ANDA"
        title={admin ? "Profil admin" : "Profil saya"}
        description="Sedikit tentang ruang kerja Anda."
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
                {state!.profile.role === "admin" ? "Admin" : "Pembeli"}
              </p>
            </div>
          </div>
          <Alert>
            Perbarui nama tampilan dan preferensi pengingat. Email akun tidak dapat diubah di sini.
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
            <Field id="profile-name" label="Nama tampilan" error={error}>
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
            <Field id="profile-email" label="Email">
              <input
                id="profile-email"
                readOnly
                value={state!.profile.email}
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
                <strong>Tampilkan pengingat</strong>
                <br />
                Pengingat tersedia di aplikasi. Tidak ada email atau push notification.
              </span>
            </label>
            <Button className="mt-6" type="submit" busy={busy}>
              <Save size={16} />
              Simpan profil
            </Button>
          </form>
        </section>
        <section className="panel demo-settings">
          <span className="eyebrow">PENGATURAN AKUN</span>
          <h2>Jelajahi sisi lainnya.</h2>
          <p>
            Arsip pembeli hanya menampilkan garansi milik akun Anda. Akses tinjauan admin memerlukan peran admin.
          </p>
          <ModeSwitcher />
          <Button variant="secondary" onClick={() => void logout()}>
            <LogOut size={16} /> Keluar
          </Button>
        </section>
      </div>

    </>
  );
}
