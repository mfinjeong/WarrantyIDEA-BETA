"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell,
  ArrowUpRight,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  ScanLine,
  UserRound,
  X,
} from "lucide-react";
import { useDemo } from "@/lib/demo/provider";
import { Alert, Dialog, Logo } from "@/components/ui";

export function ModeSwitcher() {
  const path = usePathname();
  return (
    <div className="mode-switch">
      <span>JELAJAHI DEMO</span>
      <div>
        <Link
          className={path.startsWith("/app") ? "is-selected" : ""}
          href="/app"
        >
          Pembeli
        </Link>
        <Link
          className={path.startsWith("/admin") ? "is-selected" : ""}
          href="/admin"
        >
          Admin <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
export function Shell({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const { state, warning } = useDemo();
  const root = admin ? "/admin" : "/app";
  const nav = admin
    ? ([
        [root, "Ringkasan", LayoutDashboard],
        [`${root}/catalog`, "Katalog produk", Package],
        [`${root}/reviews`, "Tinjauan", ClipboardCheck],
        [`${root}/notifications`, "Notifikasi", Bell],
        [`${root}/profile`, "Profil", UserRound],
      ] as const)
    : ([
        [root, "Ringkasan", LayoutDashboard],
        [`${root}/warranties`, "Garansi saya", Package],
        [`${root}/scan`, "Scan demo", ScanLine],
        [`${root}/notifications`, "Notifikasi", Bell],
        [`${root}/profile`, "Profil", UserRound],
      ] as const);
  const unread =
    state?.notifications.filter(
      (n) => n.audience === (admin ? "admin" : "buyer") && !n.readAt,
    ).length || 0;
  const title =
    [...nav]
      .reverse()
      .find(([href]) =>
        href === root ? path === href : path.startsWith(href),
      )?.[1] || "Garansi";
  const links = (
    <nav aria-label={admin ? "Navigasi admin" : "Navigasi pembeli"}>
      {nav.map(([href, label, Icon]) => {
        const active = href === root ? path === href : path.startsWith(href);
        return (
          <Link
            onClick={() => setMenu(false)}
            href={href}
            key={href}
            aria-current={active ? "page" : undefined}
            className={active ? "nav-active" : ""}
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === "Notifikasi" && unread > 0 && (
              <span className="nav-count">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className={`app-shell ${admin ? "admin-shell" : ""}`}>
      <aside className="sidebar">
        <Logo light={admin} />
        <span className="workspace-label">
          {admin ? "RUANG KERJA ADMIN" : "RUANG KERJA PRIBADI"}
        </span>
        {links}
        {!admin && (
          <Link
            href="/app/warranties/new"
            className="btn btn-secondary sidebar-add"
          >
            <Plus size={18} /> Tambah garansi
          </Link>
        )}
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-label">
              {admin ? "RUANG TINJAUAN" : "SEDIKIT LEBIH TENANG"}
            </span>
            <p>
              {admin
                ? "Setiap detail layak diperiksa."
                : "Barang favorit. Garansi terawat."}
            </p>
            <ArrowUpRight
              className="note-symbol"
              size={20}
              aria-hidden="true"
            />
          </div>
          <ModeSwitcher />
          <Link href="/" className="exit-link">
            <LogOut size={16} /> Keluar demo
          </Link>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-header">
          <div className="header-breadcrumb">
            <button
              onClick={() => setMenu(true)}
              className="icon-btn mobile-menu"
              aria-label="Buka menu"
            >
              <Menu size={22} />
            </button>
            <span className="desktop-only">Ruang kerja</span>
            <ChevronRight size={14} className="desktop-only" />
            <strong>{title}</strong>
            <span className="demo-label">
              {admin ? "Admin · Demo" : "Demo"}
            </span>
          </div>
          <div className="header-right">
            <span className="header-date desktop-only">
              Arsip kecil, tenang lebih lama.
            </span>
            <Link
              href={`${root}/notifications`}
              className="icon-btn notification-link"
              aria-label={`Notifikasi, ${unread} belum dibaca`}
            >
              <Bell size={20} />
              {unread > 0 && <i />}
            </Link>
            <Link
              href={`${root}/profile`}
              className="avatar"
              aria-label="Buka profil"
            >
              {(state?.profile.name || "Alex Morgan")
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)}
            </Link>
          </div>
        </header>
        <main id="main" className="app-main">
          {warning && <Alert>{warning}</Alert>}
          {children}
        </main>
      </div>
      {!admin && <div className="bottom-nav">{links}</div>}
      <Dialog
        open={menu}
        title={admin ? "Menu admin" : "Menu ruang kerja"}
        onClose={() => setMenu(false)}
      >
        <div className="drawer-nav">
          {links}
          <ModeSwitcher />
          <Link href="/" onClick={() => setMenu(false)} className="exit-link">
            <LogOut size={16} />
            Keluar demo
          </Link>
        </div>
        <button className="btn btn-secondary" onClick={() => setMenu(false)}>
          <X size={16} />
          Tutup menu
        </button>
      </Dialog>
    </div>
  );
}
