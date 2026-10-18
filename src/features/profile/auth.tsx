"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Alert, Button, Field, Logo } from "@/components/ui";

import type { Errors } from "@/lib/demo/validation";
const subscribe = () => () => {};
const hydrated = () => true;
const serverRendered = () => false;

export function AuthPage({
  register = false,
  admin = false,
}: {
  register?: boolean;
  admin?: boolean;
}) {

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
  const router = useRouter();
  const ready = useSyncExternalStore(subscribe, hydrated, serverRendered);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (
      register &&
      (values.name.trim().length < 2 || values.name.trim().length > 60)
    )
      next.name = "Nama tampilan harus 2–60 karakter.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "Masukkan alamat email yang valid.";
    if (register ? values.password.length < 12 : !values.password.trim())
      next.password = register
        ? "Password minimal 12 karakter."
        : "Isi password akun Anda.";
    if (register && values.password !== values.confirm)
      next.confirm = "Konfirmasi password belum cocok.";
    if (register && !values.agree)
      next.agree = "Konfirmasi persetujuan terlebih dahulu.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setBusy(true);
    try {
      setError("");
      const result = register
        ? await authClient.signUp.email({ name: values.name.trim(), email: values.email.trim(), password: values.password })
        : await authClient.signIn.email({ email: values.email.trim(), password: values.password });
      if (result.error) throw new Error(result.error.message || "Autentikasi gagal.");
      setValues({
        name: "",
        email: "",
        password: "",
        confirm: "",
        agree: false,
      });
      router.replace(target);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coba lagi.");
      setBusy(false);
    }
  }
  const input = (key: "name" | "email" | "password" | "confirm") => ({
    id: key,
    disabled: !ready || busy,
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
            {admin ? "ADMIN · RUANG KERJA" : "LEBIH RAPI, LEBIH TENANG"}
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
        <small>WARRANTYIDEA / ARSIP PRIBADI</small>
      </section>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">
            {admin
              ? "AKSES ADMIN"
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
              ? "Buat akun untuk menyimpan arsip garansi."
              : admin
                ? "Masuk menggunakan akun dengan peran admin."
                : "Masuk dan temukan semua garansi Anda."}
          </p>
          <Alert>Gunakan akun Anda untuk mengakses arsip pribadi.</Alert>
          {error && <Alert error>{error}</Alert>}
          <form noValidate onSubmit={submit}>
            {register && (
              <Field
                id="name"
                label="Nama tampilan"
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
            <Field id="email" label="Email" required error={errors.email}>
              <input
                {...input("email")}
                type="email"
                autoComplete="email"
                placeholder={admin ? "admin@example.test" : "alex@example.test"}
              />
            </Field>
            <Field
              id="password"
              label="Password"
              required
              error={errors.password}
            >
              <div className="password-wrap">
                <input
                  {...input("password")}
                  type={show ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={register ? 12 : undefined}
                  maxLength={128}
                  placeholder={
                    register ? "Minimal 12 karakter" : "Password akun Anda"
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
                    disabled={!ready || busy}
                    type="checkbox"
                    checked={values.agree}
                    onChange={(e) =>
                      setValues({ ...values, agree: e.target.checked })
                    }
                    aria-invalid={!!errors.agree}
                    aria-describedby="agree-help"
                  />
                  <span>
                    Saya setuju membuat akun untuk menyimpan arsip garansi saya.
                  </span>
                </label>
                {errors.agree && (
                  <p className="error-text" id="agree-help">
                    {errors.agree}
                  </p>
                )}
              </>
            )}
            <Button type="submit" busy={busy} disabled={!ready}>
              {register
                ? "Buat akun"
                : admin
                  ? "Masuk admin"
                  : "Masuk"}
              <ArrowRight size={17} />
            </Button>
          </form>

          <div className="auth-form-footer">
            {register
              ? "Sudah ingin menjelajah?"
              : admin
                ? "Ingin mencoba sisi pembeli?"
                : "Belum punya akun?"}
            <Link href={register ? "/login" : admin ? "/login" : "/register"}>
              {register
                ? "Masuk"
                : admin
                  ? "Masuk pembeli"
                  : "Buat akun"}
            </Link>
          </div>
          {!admin && (
            <div className="auth-direct">
              <Link href="/admin/login">Masuk admin</Link>
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
