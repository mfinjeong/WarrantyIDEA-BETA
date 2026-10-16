"use client";
import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import {
  Alert,
  Button,
  ConfirmDialog,
  Dialog,
  Empty,
  Field,
  PageHeading,
  Skeleton,
} from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import { categories, type CatalogProduct } from "@/lib/demo/types";
import { validateCatalog, type Errors } from "@/lib/demo/validation";
import { ProductIcon } from "@/features/warranties/product";

export function CatalogPage() {
  const { state, repository } = useDemo();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<CatalogProduct | null>(null);
  const [toggle, setToggle] = useState<CatalogProduct | null>(null);
  if (!state) return <Skeleton />;
  const filtered = state.catalog.filter(
    (p) =>
      [p.name, p.brand, p.model].some((v) =>
        v.toLowerCase().includes(q.trim().toLowerCase()),
      ) &&
      (filter === "all" || p.active === (filter === "active")),
  );
  const actions = (p: CatalogProduct) => (
    <div className="button-row">
      <Button
        variant="ghost"
        aria-label={`Edit ${p.name}`}
        onClick={() => setEditor(p)}
      >
        <Pencil size={15} />
      </Button>
      <Button variant="secondary" onClick={() => setToggle(p)}>
        {p.active ? "Nonaktifkan" : "Aktifkan"}
      </Button>
    </div>
  );
  return (
    <>
      <PageHeading
        eyebrow="ADMIN / KATALOG PRODUK"
        title="Katalog produk"
        description="Dasar arsip produk yang konsisten dan mudah ditinjau."
      >
        <Button
          onClick={() =>
            setEditor({
              id: "",
              name: "",
              brand: "",
              model: "",
              category: "electronics",
              warrantyMonths: 12,
              active: true,
            })
          }
        >
          <Plus size={18} />
          Tambah produk
        </Button>
      </PageHeading>
      <section className="panel catalog-list">
        <div className="filters">
          <div className="search-field">
            <label htmlFor="catalog-search" className="sr-only">
              Cari nama, merek, atau model katalog
            </label>
            <Search size={18} />
            <input
              id="catalog-search"
              placeholder="Cari nama, merek, atau model…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Field id="catalog-status" label="Status produk">
            <select
              id="catalog-status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Semua produk</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </Field>
        </div>
        <div className="collection-meta">
          {filtered.length} produk ditemukan
        </div>
        {filtered.length ? (
          <>
            <div
              className="table-wrap"
              role="region"
              aria-label="Tabel katalog"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Garansi</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-identity">
                          <ProductIcon name={p.name} />
                          <span>
                            <strong>{p.name}</strong>
                            <span>
                              {p.brand} · {p.model}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>{categories[p.category]}</td>
                      <td>{p.warrantyMonths} bulan</td>
                      <td>
                        <span
                          className={`badge ${p.active ? "badge-active" : "badge-expired"}`}
                        >
                          {p.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>{actions(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {filtered.map((p) => (
                <article className="warranty-card" key={p.id}>
                  <div className="product-identity">
                    <ProductIcon name={p.name} />
                    <span>
                      <strong>{p.name}</strong>
                      <span>
                        {p.brand} · {p.model}
                      </span>
                    </span>
                  </div>
                  <p className="helper mt-4">
                    {categories[p.category]} · {p.warrantyMonths} bulan ·{" "}
                    {p.active ? "Aktif" : "Nonaktif"}
                  </p>
                  <div className="mt-3">{actions(p)}</div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <Empty
            title="Produk belum ditemukan"
            description="Ubah pencarian atau tambahkan produk demo baru."
          >
            <Button
              variant="secondary"
              onClick={() => {
                setQ("");
                setFilter("all");
              }}
            >
              Reset pencarian
            </Button>
          </Empty>
        )}
      </section>
      {editor && (
        <CatalogEditor item={editor} onClose={() => setEditor(null)} />
      )}
      <ConfirmDialog
        open={!!toggle}
        title={`${toggle?.active ? "Nonaktifkan" : "Aktifkan"} produk?`}
        description={`${toggle?.name || ""} akan ${toggle?.active ? "dinonaktifkan" : "diaktifkan"} pada katalog. Arsip garansi yang sudah ada tetap tersimpan.`}
        onClose={() => setToggle(null)}
        onConfirm={() =>
          repository.upsertCatalog({ ...toggle!, active: !toggle!.active })
        }
        label={toggle?.active ? "Nonaktifkan" : "Aktifkan"}
        danger={!!toggle?.active}
      />
    </>
  );
}
function CatalogEditor({
  item,
  onClose,
}: {
  item: CatalogProduct;
  onClose: () => void;
}) {
  const { state, repository } = useDemo();
  const [values, setValues] = useState(item);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = validateCatalog(values, state!.catalog);
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`catalog-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await repository.upsertCatalog(values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      title={item.id ? "Edit produk" : "Tambah produk katalog"}
      description="Gunakan detail produk fiktif untuk demonstrasi."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit} noValidate>
        {error && <Alert error>{error}</Alert>}
        <div className="form-grid">
          {[
            ["name", "Nama produk"],
            ["brand", "Merek"],
            ["model", "Model"],
          ].map(([key, label]) => (
            <Field
              key={key}
              id={`catalog-${key}`}
              label={label}
              required
              error={errors[key]}
            >
              <input
                id={`catalog-${key}`}
                value={values[key as "name" | "brand" | "model"]}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
                maxLength={key === "name" ? 100 : 60}
                aria-invalid={!!errors[key]}
                aria-describedby={`catalog-${key}-help`}
              />
            </Field>
          ))}
          <Field id="catalog-category" label="Kategori" required>
            <select
              id="catalog-category"
              value={values.category}
              onChange={(e) =>
                setValues({
                  ...values,
                  category: e.target.value as CatalogProduct["category"],
                })
              }
            >
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="catalog-warrantyMonths"
            label="Masa garansi (bulan)"
            required
            error={errors.warrantyMonths}
          >
            <input
              id="catalog-warrantyMonths"
              type="number"
              min={1}
              max={120}
              value={values.warrantyMonths || ""}
              onChange={(e) =>
                setValues({ ...values, warrantyMonths: Number(e.target.value) })
              }
              aria-invalid={!!errors.warrantyMonths}
              aria-describedby="catalog-warrantyMonths-help"
            />
          </Field>
          <label className="check-label">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) =>
                setValues({ ...values, active: e.target.checked })
              }
            />
            Produk aktif
          </label>
        </div>
        <div className="dialog-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Batal
          </Button>
          <Button type="submit" busy={busy}>
            Simpan produk
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
