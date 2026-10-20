"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, FolderOpen, ListChecks, LogIn, Route } from "lucide-react";
import { ActionLink, Logo } from "@/components/ui";
const subscribe = () => () => {};
const hydrated = () => true;
const serverRendered = () => false;
const mobileQuery = "(max-width: 1023px)";
const subscribeMobile = (onChange: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const sections = [
  { href: "#contoh-arsip", label: "Demo kasus", detail: "Jelajahi simulasi dari laporan sampai pengembalian", Icon: FolderOpen },
  { href: "#fitur", label: "Peran pengguna", detail: "Pembeli, petugas garansi, dan mitra servis", Icon: ListChecks },
  { href: "#cara-kerja", label: "Rencana uji coba", detail: "Alur pilot bersama organisasi dan mitranya", Icon: Route },
] as const;
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const ready = useSyncExternalStore(subscribe, hydrated, serverRendered);
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverRendered);
  const header = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const intersecting = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) intersecting.add(entry.target);
        else intersecting.delete(entry.target);
      }
      const visible = Array.from(intersecting)
        .map((target) => ({ target, top: target.getBoundingClientRect().top }))
        .sort((a, b) => a.top - b.top);
      setActive(visible[0] ? `#${visible[0].target.id}` : "");
    }, { rootMargin: "-12% 0px -45% 0px", threshold: 0 });
    for (const { href } of sections) {
      const target = document.getElementById(href.slice(1));
      if (target) observer.observe(target);
    }
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (mobile && !open && nav.current?.contains(document.activeElement)) {
      toggle.current?.focus({ preventScroll: true });
    }
    if (!open || !mobile) return;
    nav.current?.querySelector("a")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) {
        if (nav.current?.contains(document.activeElement)) {
          toggle.current?.focus({ preventScroll: true });
        }
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, mobile]);
  function closeMenu() {
    setOpen(false);
    if (mobile) toggle.current?.focus({ preventScroll: true });
  }
  return (
    <header
      ref={header}
      className="marketing-header"
      data-menu-open={mobile && open}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          closeMenu();
        }
      }}
    >
      <div className="marketing-container marketing-nav">
        <Logo />
        <nav
          ref={nav}
          id="marketing-navigation"
          aria-label="Navigasi beranda"
          className={open ? "marketing-links is-open" : "marketing-links"}
          data-mobile={mobile}
          inert={mobile && !open}
        >
          <div className="marketing-links-inner">
            {sections.map(({ href, label, detail, Icon }) => (
              <Link
                onClick={() => { setActive(href); closeMenu(); }}
                key={href}
                href={href}
                className="marketing-section-link"
                aria-current={active === href ? "location" : undefined}
              >
                <span className="menu-link-icon"><Icon size={18} aria-hidden="true" /></span>
                <span className="menu-link-copy"><span>{label}</span><small>{detail}</small></span>
              </Link>
            ))}
            <Link href="/login" className="mobile-auth" onClick={closeMenu}>
              <LogIn size={18} aria-hidden="true" /> Masuk ke akun
            </Link>
            <figure className="nav-preview">
              <span className="nav-preview-art" aria-hidden="true" />
              <figcaption>Demo memakai data fiktif. Akun yang tersedia saat ini masih untuk arsip pribadi, bukan ruang kerja organisasi.</figcaption>
            </figure>
          </div>
        </nav>
        <div className="button-row">
          <Link href="/login" className="desktop-only">
            Masuk
          </Link>
          <ActionLink href="#contoh-arsip">
            Jelajah demo <ArrowUpRight size={16} aria-hidden="true" />
          </ActionLink>
          <button
            ref={toggle}
            type="button"
            disabled={!ready}
            className="icon-btn mobile-menu marketing-menu-toggle"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobile && open}
            aria-controls="marketing-navigation"
            onClick={() => setOpen(!open)}
          >
            <span className="menu-toggle-lines" aria-hidden="true"><span /><span /></span>
          </button>
        </div>
      </div>
    </header>
  );
}
