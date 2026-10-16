"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FolderOpen,
  LoaderCircle,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useDemo } from "@/lib/demo/provider";
import type { ReviewStatus, WarrantyStatus } from "@/lib/demo/types";

export function Button({
  children,
  variant = "primary",
  busy,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`btn btn-${variant} ${className}`}
      aria-busy={busy || undefined}
    >
      {busy ? <LoaderCircle className="spin" size={18} /> : null}
      {children}
    </button>
  );
}
export function ActionLink({
  href,
  children,
  secondary = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`btn btn-${secondary ? "secondary" : "primary"} ${className}`}
    >
      {children}
    </Link>
  );
}
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`logo ${light ? "logo-light" : ""}`}
      aria-label="WarrantyIDEA beranda"
    >
      <svg
        width="32"
        height="34"
        viewBox="0 0 32 34"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 13V5h12M28 21v8H16"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="m11 16 4 4 8-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        Warranty<span className="logo-suffix">IDEA</span>
        <span className="logo-dot">.</span>
      </span>
    </Link>
  );
}
const statuses = {
  active: ["Aktif", "active", CheckCircle2],
  expiring: ["Segera berakhir", "expiring", Clock3],
  expired: ["Kedaluwarsa", "expired", AlertCircle],
  pending: ["Menunggu tinjauan", "pending", Clock3],
  approved: ["Disetujui", "active", CheckCircle2],
  rejected: ["Ditolak", "expired", AlertCircle],
} as const;
export function Badge({ status }: { status: WarrantyStatus | ReviewStatus }) {
  const [label, color, Icon] = statuses[status];
  return (
    <span className={`badge badge-${color}`}>
      <Icon size={13} />
      {label}
    </span>
  );
}
export function Alert({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`alert ${error ? "alert-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <AlertCircle size={18} />
      <div>{children}</div>
    </div>
  );
}
export function Empty({
  title = "Belum ada garansi",
  description = "Mulai rapikan arsip produk pertama Anda.",
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <FolderOpen size={30} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="loading-state" aria-busy="true" role="status">
      <span className="sr-only">Memuat data demo</span>
      <div className="skeleton sk-heading" />
      <div className="skeleton sk-summary" />
      <div className="skeleton sk-content" />
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
export function Field({
  id,
  label,
  error,
  helper,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {(error || helper) && (
        <p id={`${id}-help`} className={error ? "error-text" : "helper"}>
          {error || helper}
        </p>
      )}
    </div>
  );
}
export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = dialog.querySelector<HTMLElement>("[data-autofocus]");
    first?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const nodes = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((node) => node.getClientRects().length > 0);
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === e.currentTarget)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-inner">
        <div className="section-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {description && (
          <p id={descId} className="muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </dialog>
  );
}
export function ConfirmDialog({
  open,
  title,
  description,
  onClose,
  onConfirm,
  label = "Hapus",
  danger = true,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  label?: string;
  danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={() => {
        if (!busy) {
          setError("");
          onClose();
        }
      }}
    >
      {error && <Alert error>{error}</Alert>}
      <div className="dialog-actions">
        <Button
          variant="secondary"
          data-autofocus
          disabled={busy}
          onClick={onClose}
        >
          Batal
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Aksi gagal. Coba lagi.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {label}
        </Button>
      </div>
    </Dialog>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const group = useId();
  return (
    <div className="tabs" role="tablist" aria-label="Pilihan tampilan">
      {items.map((item, i) => (
        <button
          id={`${group}-${item.value}`}
          type="button"
          key={item.value}
          role="tab"
          aria-selected={value === item.value}
          tabIndex={value === item.value ? 0 : -1}
          onClick={() => onChange(item.value)}
          onKeyDown={(e) => {
            const next =
              e.key === "ArrowRight"
                ? (i + 1) % items.length
                : e.key === "ArrowLeft"
                  ? (i - 1 + items.length) % items.length
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? items.length - 1
                      : -1;
            if (next >= 0) {
              e.preventDefault();
              onChange(items[next].value);
              document.getElementById(`${group}-${items[next].value}`)?.focus();
            }
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function ActionMenu({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div
      ref={ref}
      className="action-menu"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="icon-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div
          id={id}
          className="menu-popover"
          onClick={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
export function Toasts() {
  const { toasts, dismiss } = useDemo();
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          className={`toast ${t.error ? "toast-error" : ""}`}
          key={t.id}
          role={t.error ? "alert" : "status"}
        >
          {t.error ? <AlertCircle size={20} /> : <Check size={20} />}
          <span>{t.text}</span>
          <button
            className="icon-btn"
            onClick={() => dismiss(t.id)}
            aria-label="Tutup pemberitahuan"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
export function Missing({ admin = false }: { admin?: boolean }) {
  return (
    <div className="missing">
      <Logo />
      <div className="missing-mark">
        404<span>Arsip tak ditemukan</span>
      </div>
      <h1>Halaman tidak ditemukan</h1>
      <p>Halaman atau garansi ini mungkin sudah dipindahkan atau dihapus.</p>
      <div className="button-row">
        <ActionLink href={admin ? "/admin/reviews" : "/app/warranties"}>
          Kembali ke daftar <ArrowRight size={18} />
        </ActionLink>
        <ActionLink href="/" secondary>
          Ke beranda
        </ActionLink>
      </div>
      <Link href="/app">Buka demo pembeli</Link>
      <Link href="/admin">Jelajahi demo admin</Link>
    </div>
  );
}
