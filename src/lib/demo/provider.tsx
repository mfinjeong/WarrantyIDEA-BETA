"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  DemoRepository,
  DemoState,
  Receipt,
  WarrantyInput,
} from "./types";
import { loadDemo, resetDemo, saveDemo } from "./storage";
import { seed } from "./fixtures";
import { warrantyStatus } from "../format";
import { validateCatalog, validateWarranty } from "./validation";

type ToastMessage = { id: number; text: string; error: boolean };
type DemoContextValue = {
  state: DemoState | null;
  warning: string;
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
const delay = () => new Promise((resolve) => setTimeout(resolve, 350));
const stamp = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
function reminders(state: DemoState): DemoState {
  if (!state.profile.reminders) return state;
  const additions = state.warranties
    .filter(
      (w) =>
        warrantyStatus(w.expiryDate) === "expiring" &&
        !state.notifications.some((n) => n.id === `reminder-${w.id}`),
    )
    .map((w) => ({
      id: `reminder-${w.id}`,
      audience: "buyer" as const,
      title: "Masa garansi segera berakhir",
      body: `Periksa masa berlaku ${w.productName}. Pengingat demo lokal.`,
      createdAt: stamp(),
      href: `/app/warranties/${w.id}`,
    }));
  return { ...state, notifications: [...additions, ...state.notifications] };
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);
  const current = useRef<DemoState | null>(null);
  const [warning, setWarning] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt>>({});
  const receiptRef = useRef<Record<string, Receipt>>({});
  const [draft, setDraft] = useState<Partial<WarrantyInput> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dismiss = useCallback(
    (id: number) => setToasts((list) => list.filter((t) => t.id !== id)),
    [],
  );
  const toast = useCallback(
    (text: string, error = false) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list.slice(-3), { id, text, error }]);
      if (!error) timers.current.push(setTimeout(() => dismiss(id), 5000));
    },
    [dismiss],
  );
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (!alive) return;
      let loaded: ReturnType<typeof loadDemo>;
      try {
        loaded = loadDemo(window.localStorage);
      } catch {
        loaded = {
          state: seed(),
          warning:
            "Penyimpanan tidak tersedia. Perubahan hanya bertahan di sesi ini.",
        };
      }
      const next = reminders(loaded.state);
      current.current = next;
      setState(next);
      let storageWarning = "";
      try {
        storageWarning = saveDemo(window.localStorage, next);
      } catch {
        storageWarning =
          "Penyimpanan tidak tersedia. Perubahan hanya bertahan di sesi ini.";
      }
      setWarning(loaded.warning || storageWarning);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(receiptRef.current).forEach((r) =>
        URL.revokeObjectURL(r.url),
      );
      timers.current.forEach(clearTimeout);
    },
    [],
  );
  const setReceipt = useCallback((id: string, receipt?: Receipt) => {
    const old = receiptRef.current[id];
    if (old && old.url !== receipt?.url) URL.revokeObjectURL(old.url);
    const next = { ...receiptRef.current };
    if (receipt) next[id] = receipt;
    else delete next[id];
    receiptRef.current = next;
    setReceipts(next);
  }, []);
  const moveReceipt = (from: string, to: string) => {
    const next = { ...receiptRef.current };
    if (next[from]) {
      if (next[to] && next[to].url !== next[from].url)
        URL.revokeObjectURL(next[to].url);
      next[to] = next[from];
      delete next[from];
      receiptRef.current = next;
      setReceipts(next);
    }
  };
  const commit = (next: DemoState) => {
    current.current = next;
    setState(next);
    try {
      const message = saveDemo(window.localStorage, next);
      if (message) setWarning(message);
    } catch {
      setWarning(
        "Penyimpanan tidak tersedia. Perubahan hanya bertahan di sesi ini.",
      );
    }
  };
  const get = () => {
    if (!current.current) throw new Error("Data demo belum siap. Coba lagi.");
    return current.current;
  };
  const saveWarranty = async (input: WarrantyInput, id?: string) => {
    await delay();
    const data = get();
    const errors = validateWarranty(input, data.warranties, id);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    if (id && !data.warranties.some((w) => w.id === id))
      throw new Error("Garansi sudah tidak tersedia.");
    const savedId = id || uid();
    const now = stamp();
    const clean = {
      ...input,
      productName: input.productName.trim(),
      brand: input.brand.trim(),
      model: input.model.trim(),
      serialNumber: input.serialNumber.trim(),
      store: input.store.trim(),
    };
    const saved = {
      ...clean,
      id: savedId,
      reviewStatus: "pending" as const,
      createdAt: data.warranties.find((w) => w.id === id)?.createdAt || now,
      updatedAt: now,
    };
    const next = {
      ...data,
      warranties: id
        ? data.warranties.map((w) => (w.id === id ? saved : w))
        : [saved, ...data.warranties],
      notifications: [
        {
          id: uid(),
          audience: "admin" as const,
          title: "Garansi menunggu tinjauan",
          body: `${saved.productName} ${id ? "diperbarui" : "ditambahkan"} pada demo.`,
          createdAt: now,
          href: `/admin/reviews/${savedId}`,
        },
        ...data.notifications,
      ],
    };
    commit(reminders(next));
    toast(`Garansi ${saved.productName} disimpan.`);
    return savedId;
  };
  const repository: DemoRepository = {
    listWarranties: async () => structuredClone(get().warranties),
    getWarranty: async (id) =>
      structuredClone(get().warranties.find((w) => w.id === id)),
    listCatalog: async () => structuredClone(get().catalog),
    createWarranty: (input) => saveWarranty(input),
    updateWarranty: (id, input) => saveWarranty(input, id),
    removeWarranty: async (id) => {
      await delay();
      const data = get();
      const item = data.warranties.find((w) => w.id === id);
      commit({
        ...data,
        warranties: data.warranties.filter((w) => w.id !== id),
      });
      setReceipt(id);
      toast(`Garansi ${item?.productName || ""} dihapus.`);
    },
    upsertCatalog: async (product) => {
      await delay();
      const data = get();
      const errors = validateCatalog(product, data.catalog);
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
      const saved = {
        ...product,
        id: product.id || uid(),
        name: product.name.trim(),
        brand: product.brand.trim(),
        model: product.model.trim(),
      };
      commit({
        ...data,
        catalog: data.catalog.some((p) => p.id === saved.id)
          ? data.catalog.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...data.catalog],
      });
      toast("Katalog produk diperbarui.");
    },
    review: async (id, status, note = "") => {
      await delay();
      const data = get();
      const item = data.warranties.find((w) => w.id === id);
      if (!item) throw new Error("Garansi tidak ditemukan.");
      if (
        status === "rejected" &&
        (note.trim().length < 10 || note.length > 500)
      )
        throw new Error("Alasan harus 10–500 karakter.");
      const now = stamp();
      const label =
        status === "approved"
          ? "disetujui"
          : status === "rejected"
            ? "ditolak"
            : "dikembalikan ke antrean";
      commit({
        ...data,
        warranties: data.warranties.map((w) =>
          w.id === id
            ? {
                ...w,
                reviewStatus: status,
                reviewNote: note.trim() || undefined,
                updatedAt: now,
              }
            : w,
        ),
        notifications: [
          {
            id: uid(),
            audience: "buyer",
            title: `Tinjauan demo ${label}`,
            body: `${item.productName}: ${note || "Status tinjauan demo telah diperbarui."}`,
            createdAt: now,
            href: `/app/warranties/${id}`,
          },
          ...data.notifications,
        ],
        activity: [
          { id: uid(), text: `${item.productName} ${label}`, date: now },
          ...data.activity,
        ].slice(0, 20),
      });
      toast("Keputusan demo disimpan.");
    },
    markRead: async (id, read) => {
      const data = get();
      commit({
        ...data,
        notifications: data.notifications.map((n) =>
          n.id === id ? { ...n, readAt: read ? stamp() : undefined } : n,
        ),
      });
    },
    markAllRead: async (audience) => {
      const data = get();
      commit({
        ...data,
        notifications: data.notifications.map((n) =>
          n.audience === audience ? { ...n, readAt: n.readAt || stamp() } : n,
        ),
      });
      toast("Semua notifikasi ditandai dibaca.");
    },
    updateProfile: async (name, enabled) => {
      await delay();
      if (name.trim().length < 2 || name.trim().length > 60)
        throw new Error("Nama harus 2–60 karakter.");
      commit(
        reminders({
          ...get(),
          profile: { name: name.trim(), reminders: enabled },
        }),
      );
      toast("Profil demo disimpan.");
    },
    reset: async () => {
      await delay();
      let fresh: DemoState;
      try {
        fresh = resetDemo(window.localStorage);
      } catch {
        fresh = seed();
      }
      Object.keys(receiptRef.current).forEach((id) => setReceipt(id));
      setDraft(null);
      commit(reminders(fresh));
      toast("Data demo dikembalikan ke kondisi awal.");
    },
  };
  return (
    <Context.Provider
      value={{
        state,
        warning,
        repository,
        toast,
        toasts,
        dismiss,
        receipts,
        setReceipt,
        moveReceipt,
        draft,
        setDraft,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error("DemoProvider diperlukan.");
  return value;
}
