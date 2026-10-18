"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import {
  ActionLink,
  ActionMenu,
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  Empty,
  Field,
  PageHeading,
  Skeleton,
} from "@/components/ui";
import { useDemo } from "@/lib/demo/provider";
import { categories, type Warranty, type WarrantyPage } from "@/lib/demo/types";
import { dateLabel, remaining, warrantyStatus } from "@/lib/format";
import { ProductIdentity } from "./product";

export function WarrantyList() {
  const { state, repository, revision } = useDemo();
  const [result, setResult] = useState<{ query: string; data?: WarrantyPage; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") || "");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState({
    status: "",
    category: "",
    sort: "newest",
  });
  const [remove, setRemove] = useState<Warranty | null>(null);
  const status = params.get("status") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!("page" in values)) next.delete("page");
    router.push(`${path}?${next}`, { scroll: false });
  }
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== (params.get("q") || "")) {
        const next = new URLSearchParams(params.toString());
        if (q.trim()) next.set("q", q);
        else next.delete("q");
        next.delete("page");
        router.replace(`${path}?${next}`, { scroll: false });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, params, path, router]);
  useEffect(() => {
    const sync = () =>
      setQ(new URLSearchParams(window.location.search).get("q") || "");
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const requestQuery = new URLSearchParams();
  for (const name of ["q", "status", "category", "sort", "page"]) {
    const value = params.get(name);
    if (value) requestQuery.set(name, value);
  }
  requestQuery.set("pageSize", "6");
  const requestKey = requestQuery.toString();
  useEffect(() => {
    let active = true;
    repository.queryWarranties(requestKey).then(data => {
      if (active) setResult({ query: requestKey, data });
    }).catch(error => {
      if (active) setResult({ query: requestKey, error: error instanceof Error ? error.message : "Daftar gagal dimuat." });
    });
    return () => { active = false; };
  }, [repository, requestKey, revision, attempt]);
  if (!state) return <Skeleton />;
  const pending = result?.query !== requestKey;
  const data = !pending ? result?.data : undefined;
  const visible = data?.items || [];
  const total = data?.total;
  const page = data?.page || 1;
  const pages = data?.pages || 1;
  const query = params.get("q") || "";
  const active = !!(query || status || category || sort !== "newest");
  const listUrl = `${path}${params.toString() ? `?${params}` : ""}`;
  const href = (w: Warranty) =>
    `/app/warranties/${w.id}?from=${encodeURIComponent(listUrl)}`;
  const actions = (w: Warranty) => (
    <ActionMenu label={`Aksi untuk ${w.productName}`}>
      <Link href={href(w)}>Lihat detail</Link>
      <Link href={`/app/warranties/${w.id}/edit`}>Edit garansi</Link>
      <button className="danger-text" onClick={() => setRemove(w)}>
        Hapus garansi
      </button>
    </ActionMenu>
  );
  const controls = (mobile = false) => (
    <>
      {[
        [
          "status",
          "Status garansi",
          status,
          [
            ["", "Semua status"],
            ["active", "Aktif"],
            ["expiring", "Segera berakhir"],
            ["expired", "Kedaluwarsa"],
          ],
        ],
        [
          "category",
          "Kategori",
          category,
          [["", "Semua kategori"], ...Object.entries(categories)],
        ],
        [
          "sort",
          "Urutan",
          sort,
          [
            ["newest", "Terbaru"],
            ["expiry", "Berakhir terdekat"],
            ["name", "Nama A–Z"],
          ],
        ],
      ].map(([key, label, value, options]) => (
        <Field
          key={String(key)}
          id={`${mobile ? "mobile-" : ""}${key}`}
          label={String(label)}
        >
          <select
            id={`${mobile ? "mobile-" : ""}${key}`}
            value={
              mobile
                ? filterDraft[key as keyof typeof filterDraft]
                : String(value)
            }
            onChange={(e) =>
              mobile
                ? setFilterDraft({
                    ...filterDraft,
                    [String(key)]: e.target.value,
                  })
                : update({ [String(key)]: e.target.value })
            }
          >
            {(options as string[][]).map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      ))}
    </>
  );
  return (
    <>
      <PageHeading
        eyebrow="ARSIP GARANSI ANDA"
        title="Garansi saya"
        description={`${state.stats.total} produk, satu tempat yang lebih rapi.`}
      >
        <ActionLink href="/app/warranties/new">
          <Plus size={18} />
          Tambah garansi
        </ActionLink>
      </PageHeading>
      <section className="panel">
        <div className="filters">
          <div className="search-field">
            <label htmlFor="warranty-search" className="sr-only">
              Cari produk, merek, model, serial, atau toko
            </label>
            <Search size={18} />
            <input
              id="warranty-search"
              placeholder="Cari produk, merek, atau serial…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                className="icon-btn clear-search"
                aria-label="Hapus pencarian"
                onClick={() => setQ("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="filter-selects">{controls()}</div>
          <Button
            variant="secondary"
            className="mobile-filter-btn"
            aria-label="Buka filter dan urutan"
            onClick={() => {
              setFilterDraft({ status, category, sort });
              setFilterOpen(true);
            }}
          >
            <SlidersHorizontal size={19} />
          </Button>
        </div>
        <div className="collection-meta">
          <span>{total === undefined ? "Memuat daftar…" : `${total} garansi ditemukan`}</span>
          {active && (
            <button
              className="text-link"
              onClick={() => {
                setQ("");
                router.push(path, { scroll: false });
              }}
            >
              Hapus filter <X size={13} />
            </button>
          )}
        </div>
        {pending ? <Skeleton /> : result?.error ? (
          <div role="alert">{result.error}<Button onClick={() => { setResult(null); setAttempt(n => n + 1); }}>Coba lagi</Button></div>
        ) : !visible.length ? (
          <Empty
            title={
              state.stats.total
                ? "Tidak ada garansi yang cocok"
                : "Arsip pertama Anda dimulai di sini"
            }
            description={
              state.stats.total
                ? "Coba kata kunci atau filter lain."
                : "Tambahkan produk agar tanggal garansinya mudah dipantau."
            }
          >
            {state.stats.total ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQ("");
                  router.push(path);
                }}
              >
                Hapus filter
              </Button>
            ) : (
              <ActionLink href="/app/warranties/new">Tambah garansi</ActionLink>
            )}
          </Empty>
        ) : (
          <>
            <div
              className="table-wrap"
              tabIndex={0}
              role="region"
              aria-label="Tabel garansi"
            >
              <table>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Pembelian</th>
                    <th>Berakhir</th>
                    <th>Status</th>
                    <th>Tinjauan</th>
                    <th>
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link href={href(w)}>
                          <ProductIdentity product={w} />
                        </Link>
                      </td>
                      <td className="date-cell">{dateLabel(w.purchaseDate)}</td>
                      <td className="date-cell">
                        {dateLabel(w.expiryDate)}
                        <span>{remaining(w.expiryDate)}</span>
                      </td>
                      <td>
                        <Badge status={warrantyStatus(w.expiryDate)} />
                      </td>
                      <td>
                        <Badge status={w.reviewStatus} />
                      </td>
                      <td>{actions(w)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {visible.map((w) => (
                <article className="warranty-card" key={w.id}>
                  <div className="warranty-card-top">
                    <Link href={href(w)}>
                      <ProductIdentity product={w} />
                    </Link>
                    {actions(w)}
                  </div>
                  <dl className="warranty-card-info">
                    <div>
                      <dt>Pembelian</dt>
                      <dd>{dateLabel(w.purchaseDate)}</dd>
                    </div>
                    <div>
                      <dt>Berakhir</dt>
                      <dd>{dateLabel(w.expiryDate)}</dd>
                    </div>
                  </dl>
                  <div className="warranty-card-badges">
                    <Badge status={warrantyStatus(w.expiryDate)} />
                    <Badge status={w.reviewStatus} />
                  </div>
                  <Link className="text-link" href={href(w)}>
                    Lihat detail <ArrowRight size={14} />
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
        <div className="pagination">
          <span>
            Halaman {page} dari {pages}
          </span>
          <div>
            <Button
              variant="secondary"
              disabled={pending || page <= 1}
              onClick={() => update({ page: String(page - 1) })}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              disabled={pending || page >= pages}
              onClick={() => update({ page: String(page + 1) })}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </section>
      <Dialog
        open={filterOpen}
        title="Filter & urutan"
        onClose={() => setFilterOpen(false)}
      >
        <div className="form-grid">{controls(true)}</div>
        <div className="dialog-actions">
          <Button
            variant="secondary"
            onClick={() =>
              setFilterDraft({ status: "", category: "", sort: "newest" })
            }
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              update(filterDraft);
              setFilterOpen(false);
            }}
          >
            Terapkan
          </Button>
        </div>
      </Dialog>
      <ConfirmDialog
        open={!!remove}
        title="Hapus garansi?"
        description={`Garansi ${remove?.productName || ""} dan preview lokalnya akan dihapus.`}
        onClose={() => setRemove(null)}
        onConfirm={() => repository.removeWarranty(remove!.id)}
        label="Hapus garansi"
      />
    </>
  );
}
