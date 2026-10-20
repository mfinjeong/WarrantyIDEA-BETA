"use client";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, FolderOpen, ShieldCheck } from "lucide-react";
import { Alert, Button, Field, Logo } from "@/components/ui";
import { WarrantyRange } from "@/components/marketing/warranty-range";

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
    if (register ? values.password.length < 8 : !values.password.trim())
      next.password = register
        ? "Password minimal 8 karakter."
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
          <h2>
            {admin
              ? "Periksa garansi yang masuk."
              : "Tanggal beli sering lupa. Nomor seri juga."}
          </h2>
          <p>
            {admin
              ? "Buka antrean tinjauan, periksa detail produk, lalu catat keputusan Anda."
              : "Catat sekali di sini. Saat dibutuhkan, cari nama barangnya tanpa membongkar laci."}
          </p>
        </div>
        <div className="auth-archive" aria-hidden="true">
          <div className="auth-archive-tab"><FolderOpen size={20} /> Arsip pribadi</div>
          <Image src="/images/headphones.jpg" alt="" width={362} height={150} className="auth-product-photo" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginTop: 12 }} />
          <div className="auth-archive-row"><ShieldCheck size={24} /><span>Headphone · contoh arsip<strong>Tanggal beli dan nomor seri</strong></span><Check size={18} /></div>
          <div className="auth-archive-row"><FolderOpen size={24} /><span>Bukti pembelian<strong>Preview lokal di perangkat</strong></span><Check size={18} /></div>
          <WarrantyRange bought="12 September 2026" ends="12 September 2027" />
        </div>
        <small>WARRANTYIDEA / ARSIP PRIBADI</small>
      </section>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <h1>
            {admin
              ? "Ruang kerja admin"
              : register
                ? "Buat akun WarrantyIDEA"
                : "Masuk ke arsip Anda"}
          </h1>
          <p>
            {register
              ? "Setelah daftar, Anda bisa langsung mencatat garansi pertama."
              : admin
                ? "Masuk menggunakan akun dengan peran admin."
                : "Pakai email yang Anda daftarkan sebelumnya."}
          </p>
          {error && <Alert error>{error}</Alert>}
          <form noValidate onSubmit={submit} aria-busy={busy}>
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
                  placeholder="Nama Anda"
                />
              </Field>
            )}
            <Field id="email" label="Email" required error={errors.email}>
              <input
                {...input("email")}
                type="email"
                autoComplete="email"
                placeholder={admin ? "admin@example.test" : "nama@email.com"}
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
                  minLength={register ? 8 : undefined}
                  maxLength={128}
                  placeholder={
                    register ? "Minimal 8 karakter" : "Password akun Anda"
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
              ? "Sudah punya akun?"
              : admin
                ? "Bukan akun admin?"
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
            <Link href="/"><ArrowLeft size={15} aria-hidden="true" /> Kembali ke beranda</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
