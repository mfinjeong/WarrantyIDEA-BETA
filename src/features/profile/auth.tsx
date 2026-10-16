"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Alert, Button, Field, Logo } from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import type { Errors } from "@/lib/demo/validation";

export function AuthPage({
  register = false,
  admin = false,
}: {
  register?: boolean;
  admin?: boolean;
}) {
  const { repository, state, toast } = useDemo();
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const target = admin ? "/admin" : "/app";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (
      register &&
      (values.name.trim().length < 2 || values.name.trim().length > 60)
    )
      next.name = "Nama tampilan harus 2–60 karakter.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "Masukkan alamat email demo yang valid.";
    if (register ? values.password.length < 8 : !values.password.trim())
      next.password = register
        ? "Password minimal 8 karakter."
        : "Isi password demo.";
    if (register && values.password !== values.confirm)
      next.confirm = "Konfirmasi password belum cocok.";
    if (register && !values.agree)
      next.agree = "Konfirmasi pemahaman mode demo terlebih dahulu.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      if (register)
        await repository.updateProfile(
          values.name,
          state?.profile.reminders ?? true,
        );
      else await new Promise((r) => setTimeout(r, 350));
      setValues({
        name: "",
        email: "",
        password: "",
        confirm: "",
        agree: false,
      });
      toast("Anda memasuki mode demo. Tidak ada autentikasi nyata.");
      router.push(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coba lagi.");
      setBusy(false);
    }
  }
  const input = (key: "name" | "email" | "password" | "confirm") => ({
    id: key,
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [key]: e.target.value });
      setErrors({ ...errors, [key]: "" });
    },
    "aria-invalid": !!errors[key],
    "aria-describedby": `${key}-help`,
  });
  return (
    <main id="main" className={`auth-layout ${admin ? "auth-admin" : ""}`}>
      <section className="auth-brand">
        <Logo light={admin} />
        <div>
          <span className="eyebrow">
            {admin ? "ADMIN · RUANG KERJA DEMO" : "LEBIH RAPI, LEBIH TENANG"}
          </span>
          <h2>
            {admin
              ? "Setiap detail, ditinjau dengan teliti."
              : "Barang favorit punya tempat untuk pulang."}
          </h2>
          <p>
            {admin
              ? "Kelola katalog dan jelajahi alur tinjauan garansi dalam satu ruang kerja."
              : "Simpan detailnya, rapikan arsipnya, dan sisakan ruang untuk hal yang lebih penting."}
          </p>
        </div>
        <span className="auth-symbol" aria-hidden="true">
          ↗
        </span>
        <small>WARRANTYIDEA / FRONTEND DEMO</small>
      </section>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">
            {admin
              ? "AKSES ADMIN / SIMULASI"
              : register
                ? "ARSIP ANDA DIMULAI DI SINI"
                : "SELAMAT DATANG DI RUANG ANDA"}
          </span>
          <h1>
            {admin
              ? "Ruang kerja admin"
              : register
                ? "Mulai lebih teratur."
                : "Senang melihat Anda."}
          </h1>
          <p>
            {register
              ? "Buat profil demo untuk menjelajahi arsip garansi."
              : admin
                ? "Masuk untuk mencoba alur admin dengan data fiktif."
                : "Masuk ke demo pembeli dan temukan semua garansi Anda."}
          </p>
          <Alert>
            Demo frontend. Isian tidak diautentikasi atau disimpan. Gunakan data
            fiktif.
          </Alert>
          {error && <Alert error>{error}</Alert>}
          <form noValidate onSubmit={submit}>
            {register && (
              <Field
                id="name"
                label="Nama tampilan demo"
                required
                error={errors.name}
              >
                <input
                  {...input("name")}
                  maxLength={60}
                  autoComplete="nickname"
                  placeholder="Alex Demo"
                />
              </Field>
            )}
            <Field id="email" label="Email demo" required error={errors.email}>
              <input
                {...input("email")}
                type="email"
                autoComplete="off"
                placeholder={admin ? "admin@example.test" : "alex@example.test"}
              />
            </Field>
            <Field
              id="password"
              label="Password demo"
              required
              error={errors.password}
            >
              <div className="password-wrap">
                <input
                  {...input("password")}
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={
                    register ? "Minimal 8 karakter" : "Isi password fiktif"
                  }
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={
                    show ? "Sembunyikan password" : "Tampilkan password"
                  }
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {register && (
              <>
                <Field
                  id="confirm"
                  label="Konfirmasi password"
                  required
                  error={errors.confirm}
                >
                  <input
                    {...input("confirm")}
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                  />
                </Field>
                <label className="check-label" htmlFor="agree">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={values.agree}
                    onChange={(e) =>
                      setValues({ ...values, agree: e.target.checked })
                    }
                    aria-invalid={!!errors.agree}
                    aria-describedby="agree-help"
                  />
                  <span>
                    Saya memahami ini demo frontend, bukan akun atau autentikasi
                    sungguhan.
                  </span>
                </label>
                {errors.agree && (
                  <p className="error-text" id="agree-help">
                    {errors.agree}
                  </p>
                )}
              </>
            )}
            <Button type="submit" busy={busy} disabled={register && !state}>
              {register
                ? "Buat profil demo"
                : admin
                  ? "Masuk demo admin"
                  : "Masuk demo pembeli"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <div className="auth-direct">
            <Link href={target}>
              {admin
                ? "Langsung jelajahi demo admin"
                : "Jelajahi tanpa mengisi form"}{" "}
              ↗
            </Link>
          </div>
          <div className="auth-form-footer">
            {register
              ? "Sudah ingin menjelajah?"
              : admin
                ? "Ingin mencoba sisi pembeli?"
                : "Belum punya profil demo?"}
            <Link href={register ? "/login" : admin ? "/login" : "/register"}>
              {register
                ? "Masuk demo"
                : admin
                  ? "Masuk pembeli"
                  : "Buat profil demo"}
            </Link>
          </div>
          {!admin && (
            <div className="auth-direct">
              <Link href="/admin/login">Masuk demo admin</Link>
            </div>
          )}
          <div className="auth-direct">
            <Link href="/">← Kembali ke beranda</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
