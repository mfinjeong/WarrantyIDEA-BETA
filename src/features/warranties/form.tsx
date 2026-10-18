"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import {
  Alert,
  Button,
  Dialog,
  Field,
  Missing,
  PageHeading,
  Skeleton,
} from "@/components/ui";
import { useDemo, useWarranty } from "@/lib/demo/provider";
import {
  categories,
  type Warranty,
  type WarrantyInput,
} from "@/lib/demo/types";
import { validateWarranty, type Errors } from "@/lib/demo/validation";
import { today } from "@/lib/format";
import { ReceiptUpload } from "./receipt";

export function WarrantyForm({ id }: { id?: string }) {
  const { state } = useDemo();
  const { item, loading, error, retry } = useWarranty(id);
  if (!state || loading) return <Skeleton />;
  if (error) return <Alert error>{error}<Button onClick={retry}>Coba lagi</Button></Alert>;
  if (id && !item) return <Missing />;
  return <WarrantyEditor key={id || "new"} item={item} />;
}
function WarrantyEditor({ item }: { item?: Warranty }) {
  const {
    state,
    repository,
    draft,
    setDraft,
    receipts,
    setReceipt,
    moveReceipt,
  } = useDemo();
  const router = useRouter();
  const empty: WarrantyInput = {
    productName: "",
    brand: "",
    model: "",
    category: "electronics",
    serialNumber: "",
    store: "",
    purchaseDate: "",
    expiryDate: "",
    notes: "",
  };
  const [values, setValues] = useState<WarrantyInput>(() =>
    item
      ? {
          productName: item.productName,
          brand: item.brand,
          model: item.model,
          category: item.category,
          serialNumber: item.serialNumber,
          store: item.store,
          purchaseDate: item.purchaseDate,
          expiryDate: item.expiryDate,
          price: item.price,
          notes: item.notes,
          receiptDemoAssetId: item.receiptDemoAssetId,
        }
      : { ...empty, ...draft },
  );
  const [initial] = useState(() => JSON.stringify(values));
  const [receiptChanged, setReceiptChanged] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [destination, setDestination] = useState<string | null>(null);
  const allow = useRef(false);
  const dirty =
    JSON.stringify(values) !== initial || receiptChanged || (!item && !!draft);
  const receiptKey = "__form";
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
    return () => {
      // A Strict Mode effect replay must not discard a freshly transferred scan draft.
      cleanupTimer.current = setTimeout(() => {
        setReceipt("__form");
        setDraft(null);
      }, 0);
    };
  }, [setReceipt, setDraft]);
  useEffect(() => {
    if (!dirty) return;
    const before = (e: BeforeUnloadEvent) => {
      if (!allow.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e: MouseEvent) => {
      if (
        allow.current ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const anchor = (e.target as Element).closest("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (
        url.origin !== location.origin ||
        (url.pathname === location.pathname && url.search === location.search)
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setDestination(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  function change(key: keyof WarrantyInput, value: string) {
    const next = {
      ...values,
      [key]:
        key === "price" ? (value === "" ? undefined : Number(value)) : value,
    };
    setValues(next);
    if (touched[key] || submitted)
      setErrors(validateWarranty(next, state!.warranties, item?.id));
  }
  function attrs(key: keyof WarrantyInput) {
    return {
      id: key,
      name: key,
      value: values[key] ?? "",
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => change(key, e.target.value),
      onBlur: () => {
        setTouched({ ...touched, [key]: true });
        setErrors(validateWarranty(values, state!.warranties, item?.id));
      },
      "aria-invalid": !!errors[key] && (!!touched[key] || submitted),
      "aria-describedby": `${key}-help`,
    };
  }
  const error = (key: string) =>
    touched[key] || submitted ? errors[key] : undefined;
  const back = item ? `/app/warranties/${item.id}` : "/app/warranties";
  function leave(url: string) {
    if (dirty) setDestination(url);
    else router.push(url);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const next = validateWarranty(values, state!.warranties, item?.id);
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setBusy(true);
    setServerError("");
    try {
      const id = item
        ? await repository.updateWarranty(item.id, values)
        : await repository.createWarranty(values);
      if (receiptChanged || receipts[receiptKey]) {
        if (receipts[receiptKey]) moveReceipt(receiptKey, id);
        else setReceipt(id);
      }
      allow.current = true;
      setDraft(null);
      router.push(`/app/warranties/${id}`);
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Garansi belum tersimpan. Coba lagi.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="form-container">
      <Link className="back-link" href={back}>
        <ArrowLeft size={16} />
        Kembali ke {item ? "detail" : "daftar"}
      </Link>
      <PageHeading
        eyebrow="TEMPAT UNTUK SETIAP DETAIL"
        title={item ? "Edit garansi" : "Tambah garansi"}
        description="Isi detailnya sekarang. Lebih mudah ditemukan nanti."
      />
      <Alert>
        Detail garansi disimpan di akun Anda. Gambar nota hanya preview lokal,
        tidak diunggah dan hilang setelah halaman dimuat ulang.
      </Alert>
      <form noValidate onSubmit={submit}>
        {submitted && Object.keys(errors).length > 0 && (
          <div className="form-error-summary" role="alert">
            <strong>Periksa kembali beberapa detail:</strong>
            {Object.entries(errors).map(([key, message]) => (
              <a
                key={key}
                href={`#${key}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(key)?.focus();
                }}
              >
                {message}
              </a>
            ))}
          </div>
        )}
        {serverError && <Alert error>{serverError}</Alert>}
        <section className="panel form-section">
          <h2>01 · Produk</h2>
          <p>Detail kecil yang membedakan produk Anda.</p>
          <div className="form-grid">
            <div className="full-span">
              <Field
                id="productName"
                label="Nama produk"
                required
                error={error("productName")}
              >
                <input
                  {...attrs("productName")}
                  maxLength={100}
                  placeholder="Contoh: Headphone wireless"
                  required
                />
              </Field>
            </div>
            {[
              ["brand", "Merek"],
              ["model", "Model"],
            ].map(([key, label]) => (
              <Field
                key={key}
                id={key}
                label={label}
                required
                error={error(key)}
              >
                <input
                  {...attrs(key as keyof WarrantyInput)}
                  maxLength={60}
                  required
                />
              </Field>
            ))}
            <Field
              id="category"
              label="Kategori"
              required
              error={error("category")}
            >
              <select {...attrs("category")}>
                {Object.entries(categories).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="serialNumber"
              label="Nomor seri"
              required
              error={error("serialNumber")}
              helper="Gunakan nomor seri yang unik dalam arsip Anda."
            >
              <input
                {...attrs("serialNumber")}
                maxLength={80}
                required
                placeholder="SN-XXXX-0001"
              />
            </Field>
          </div>
        </section>
        <section className="panel form-section">
          <h2>02 · Pembelian & masa berlaku</h2>
          <p>Tanggal yang membuat garansi lebih mudah dipantau.</p>
          <div className="form-grid">
            <div className="full-span">
              <Field
                id="store"
                label="Toko pembelian"
                required
                error={error("store")}
              >
                <input
                  {...attrs("store")}
                  maxLength={100}
                  required
                  placeholder="Nama toko"
                />
              </Field>
            </div>
            <Field
              id="purchaseDate"
              label="Tanggal pembelian"
              required
              error={error("purchaseDate")}
            >
              <input
                {...attrs("purchaseDate")}
                type="date"
                max={today()}
                required
              />
            </Field>
            <Field
              id="expiryDate"
              label="Tanggal berakhir"
              required
              error={error("expiryDate")}
            >
              <input
                {...attrs("expiryDate")}
                type="date"
                min={values.purchaseDate || undefined}
                required
              />
            </Field>
            <div className="full-span">
              <Field
                id="price"
                label="Harga pembelian (opsional)"
                error={error("price")}
                helper="Nominal rupiah, tanpa titik atau koma."
              >
                <input
                  {...attrs("price")}
                  type="number"
                  min={0}
                  max={999999999999}
                  step={1}
                  inputMode="numeric"
                  placeholder="2499000"
                />
              </Field>
            </div>
          </div>
        </section>
        <section className="panel form-section">
          <h2>03 · Bukti & catatan</h2>
          <p>Preview gambar hanya tersedia selama sesi aplikasi ini.</p>
          <ReceiptUpload
            value={
              receipts[receiptKey] ||
              (receiptChanged
                ? undefined
                : item
                  ? receipts[item.id]
                  : undefined)
            }
            onChange={(r) => {
              setReceipt(receiptKey, r);
              setReceiptChanged(true);
              setValues({ ...values, receiptDemoAssetId: undefined });
            }}
          />
          <div style={{ marginTop: 24 }}>
            <Field
              id="notes"
              label="Catatan (opsional)"
              error={error("notes")}
              helper={`${values.notes.length}/1.000 karakter`}
            >
              <textarea
                {...attrs("notes")}
                maxLength={1000}
                placeholder="Detail tambahan yang ingin Anda ingat…"
              />
            </Field>
          </div>
        </section>
        <div className="form-actions">
          <Button
            variant="secondary"
            type="button"
            disabled={busy}
            onClick={() => leave(back)}
          >
            Batal
          </Button>
          <Button type="submit" busy={busy}>
            <Save size={17} />
            {item ? "Simpan perubahan" : "Simpan garansi"}
          </Button>
        </div>
      </form>
      <Dialog
        open={!!destination}
        title="Tinggalkan perubahan?"
        description="Perubahan yang belum disimpan dan preview baru akan dibuang."
        onClose={() => setDestination(null)}
      >
        <div className="dialog-actions">
          <Button
            variant="secondary"
            data-autofocus
            onClick={() => setDestination(null)}
          >
            Lanjut mengedit
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              allow.current = true;
              router.push(destination!);
              setDestination(null);
            }}
          >
            Buang perubahan
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
