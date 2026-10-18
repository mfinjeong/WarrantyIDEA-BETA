"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { DemoRepository, DemoState, Receipt, Warranty, WarrantyInput, WarrantyPage, WorkspaceState } from "./types";
import { api, ApiError } from "../api-client";
import { authClient } from "../auth-client";
import { configureBusinessTimeZone } from "../calendar";
import { today } from "../format";

type ToastMessage = { id: number; text: string; error: boolean };
type DemoContextValue = {
  state: WorkspaceState | null;
  warning: string;
  loading: boolean;
  checkingIdentity: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  revision: number;
  repository: DemoRepository;
  toast: (text: string, error?: boolean) => void;
  toasts: ToastMessage[];
  dismiss: (id: number) => void;
  receipts: Record<string, Receipt>;
  setReceipt: (id: string, receipt?: Receipt) => void;
  moveReceipt: (from: string, to: string) => void;
  draft: Partial<WarrantyInput> | null;
  setDraft: (draft: Partial<WarrantyInput> | null) => void;
};
const Context = createContext<DemoContextValue | null>(null);
const key = (id: string) => encodeURIComponent(id);
export function DemoProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const scope = path.startsWith("/admin") && path !== "/admin/login" ? "admin" : "buyer";
  const protectedPage = path.startsWith("/app") || (path.startsWith("/admin") && path !== "/admin/login");
  const [snapshot, setSnapshot] = useState<{ scope: string; data: WorkspaceState } | null>(null);
  // Never expose the previous admin snapshot while navigating into buyer scope.
  const state = snapshot?.scope === scope && protectedPage ? snapshot.data : null;
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingIdentity, setCheckingIdentity] = useState(false);
  const [revision, setRevision] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt>>({});
  const receiptRef = useRef<Record<string, Receipt>>({});
  const [draft, setDraft] = useState<Partial<WarrantyInput> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generation = useRef(0);
  const identity = useRef<string | null>(null);
  const dismiss = useCallback((id: number) => setToasts(list => list.filter(t => t.id !== id)), []);
  const toast = useCallback((text: string, error = false) => {
    const id = Date.now() + Math.random();
    setToasts(list => [...list.slice(-3), { id, text, error }]);
    if (!error) timers.current.push(setTimeout(() => dismiss(id), 5000));
  }, [dismiss]);
  const clearAssets = useCallback(() => {
    setDraft(null);
    Object.values(receiptRef.current).forEach(r => URL.revokeObjectURL(r.url));
    receiptRef.current = {};
    setReceipts({});
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setToasts([]);
  }, []);
  const clearPrivate = useCallback(() => {
    generation.current++;
    identity.current = null;
    setSnapshot(null);
    clearAssets();
  }, [clearAssets]);
  const refresh = useCallback(async (verifyIdentity = false) => {
    const request = ++generation.current;
    if (!protectedPage) { clearPrivate(); setWarning(""); setLoading(false); setCheckingIdentity(false); return; }
    if (verifyIdentity) setCheckingIdentity(true);
    setLoading(true);
    setWarning("");
    try {
      const data = await api<WorkspaceState>(`/api/workspace?scope=${scope}`);
      if (request !== generation.current) return;
      configureBusinessTimeZone(data.calendar.timeZone);
      if (identity.current && identity.current !== data.profile.id) clearAssets();
      identity.current = data.profile.id;
      setSnapshot({ scope, data });
      setRevision(n => n + 1);
    } catch (error) {
      if (request !== generation.current) return;
      setSnapshot(null);
      setWarning(error instanceof Error ? error.message : "Data gagal dimuat.");
      if (error instanceof ApiError && error.status === 401) {
        clearPrivate();
        router.replace(scope === "admin" ? "/admin/login" : "/login");
      }
    } finally { if (request === generation.current) { setLoading(false); setCheckingIdentity(false); } }
  }, [scope, protectedPage, clearAssets, clearPrivate, router]);
  useEffect(() => {
    let alive = true;
    const requests = generation;
    void Promise.resolve().then(() => { if (alive) void refresh(); });
    const focus = () => void refresh(true);
    let observedDay = today();
    const rollover = setInterval(() => {
      const day = today();
      if (day !== observedDay) { observedDay = day; void refresh(); }
    }, 60000);
    window.addEventListener("focus", focus);
    return () => { alive = false; requests.current++; clearInterval(rollover); window.removeEventListener("focus", focus); };
  }, [refresh]);
  useEffect(() => () => {
    Object.values(receiptRef.current).forEach(r => URL.revokeObjectURL(r.url));
    timers.current.forEach(clearTimeout);
  }, []);
  const setReceipt = useCallback((id: string, receipt?: Receipt) => {
    const old = receiptRef.current[id];
    if (old && old.url !== receipt?.url) URL.revokeObjectURL(old.url);
    const next = { ...receiptRef.current };
    if (receipt) next[id] = receipt; else delete next[id];
    receiptRef.current = next;
    setReceipts(next);
  }, []);
  const moveReceipt = (from: string, to: string) => {
    const next = { ...receiptRef.current };
    if (!next[from]) return;
    if (next[to] && next[to].url !== next[from].url) URL.revokeObjectURL(next[to].url);
    next[to] = next[from]; delete next[from]; receiptRef.current = next; setReceipts(next);
  };
  const logout = useCallback(async () => {
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message || "Gagal keluar.");
      clearPrivate();
      router.replace("/login");
      router.refresh();
    } catch (error) { toast(error instanceof Error ? error.message : "Gagal keluar.", true); }
  }, [clearPrivate, toast, router]);
  const expectedUserId = state?.profile.id;
  const repository = useMemo<DemoRepository>(() => {
    async function mutate<T>(url: string, method: string, body?: unknown): Promise<T> {
      if (!expectedUserId) throw new Error("Sesi akun belum siap. Muat ulang ruang kerja.");
      let data: T;
      try {
        data = await api<T>(url, { method, headers: { "X-Workspace-User": expectedUserId }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
      } catch (error) {
        if (error instanceof ApiError && (error.code === "SESSION_CHANGED" || error.status === 401)) {
          clearPrivate();
          await refresh(true);
        }
        throw error;
      }
      await refresh();
      if (identity.current !== expectedUserId)
        throw new ApiError("Akun telah berubah. Muat ulang ruang kerja sebelum melanjutkan.", 409, "SESSION_CHANGED");
      return data;
    }
    async function save(input: WarrantyInput, id?: string) {
      // Previews are ephemeral; never send synthetic receipt/upload identifiers.
      const payload = { productName: input.productName, brand: input.brand, model: input.model, category: input.category, serialNumber: input.serialNumber, store: input.store, purchaseDate: input.purchaseDate, expiryDate: input.expiryDate, price: input.price, notes: input.notes };
      const saved = await mutate<Warranty>(id ? `/api/warranties/${key(id)}` : "/api/warranties", id ? "PUT" : "POST", payload);
      toast(`Garansi ${saved.productName} disimpan.`);
      return saved.id;
    }
    return {
      listWarranties: async () => (await api<WarrantyPage>("/api/warranties?pageSize=6")).items,
      queryWarranties: query => api<WarrantyPage>(`/api/warranties?${query}`),
      getWarranty: async id => { try { return await api<Warranty>(`/api/warranties/${key(id)}`); } catch (error) { if (error instanceof ApiError && error.status === 404) return undefined; throw error; } },
      listCatalog: async () => (await api<DemoState>(`/api/workspace?scope=${scope}`)).catalog,
      createWarranty: input => save(input),
      updateWarranty: (id, input) => save(input, id),
      removeWarranty: async id => { await mutate(`/api/warranties/${key(id)}`, "DELETE"); setReceipt(id); toast("Garansi dihapus."); },
      upsertCatalog: async product => { await mutate("/api/catalog", "POST", product); toast("Katalog produk diperbarui."); },
      review: async (id, status, expectedRevision, note = "") => { await mutate(`/api/reviews/${key(id)}`, "POST", { status, expectedRevision, note }); toast("Keputusan tinjauan disimpan."); },
      markRead: async (id, read) => { try { await mutate(`/api/notifications/${key(id)}`, "PATCH", { read }); } catch (error) { toast(error instanceof Error ? error.message : "Gagal menyimpan notifikasi.", true); } },
      markAllRead: async audience => { try { await mutate("/api/notifications", "PATCH", { audience }); toast("Semua notifikasi ditandai dibaca."); } catch (error) { toast(error instanceof Error ? error.message : "Gagal menyimpan notifikasi.", true); } },
      updateProfile: async (name, reminders) => { await mutate("/api/profile", "PATCH", { name, reminders }); toast("Profil disimpan."); },
      reset: async () => { throw new Error("Reset data tidak tersedia."); },
    };
  }, [refresh, scope, setReceipt, toast, expectedUserId, clearPrivate]);
  return <Context.Provider value={{ state, warning, loading, checkingIdentity, refresh, logout, revision, repository, toast, toasts, dismiss, receipts, setReceipt, moveReceipt, draft, setDraft }}>{children}</Context.Provider>;
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error("DemoProvider diperlukan.");
  return value;
}

/** Fetch an owner-authorized record even when absent from a bounded snapshot. */
export function useWarranty(id?: string) {
  const { repository, revision } = useDemo();
  const [result, setResult] = useState<{ id?: string; item?: Warranty; loading: boolean; error: string }>({ loading: !!id, error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!id) return;
    repository.getWarranty(id).then(item => { if (active) setResult({ id, item, loading: false, error: "" }); }).catch(error => { if (active) setResult({ id, loading: false, error: error instanceof Error ? error.message : "Garansi gagal dimuat." }); });
    return () => { active = false; };
  }, [id, repository, revision, attempt]);
  return { item: result.id === id ? result.item : undefined, loading: !!id && (result.loading || result.id !== id), error: result.id === id ? result.error : "", retry: () => { setResult({ id, loading: true, error: "" }); setAttempt(n => n + 1); } };
}
