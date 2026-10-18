"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ActionLink, Logo } from "@/components/ui";
const subscribe = () => () => {};
const hydrated = () => true;
const serverRendered = () => false;
export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const ready = useSyncExternalStore(subscribe, hydrated, serverRendered);
  const header = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector("a")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <header
      ref={header}
      className="marketing-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          toggle.current?.focus({ preventScroll: true });
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
        >
          {[
            ["#manfaat", "Manfaat"],
            ["#fitur", "Fitur"],
            ["#cara-kerja", "Cara kerja"],
          ].map(([href, label]) => (
            <Link onClick={() => setOpen(false)} key={href} href={href}>
              {label}
            </Link>
          ))}
          <Link href="/login" className="mobile-auth">
            Masuk
          </Link>
        </nav>
        <div className="button-row">
          <Link href="/login" className="desktop-only">
            Masuk
          </Link>
          <ActionLink href="/register">
            Mulai sekarang <ArrowUpRight size={16} aria-hidden="true" />
          </ActionLink>
          <button
            ref={toggle}
            disabled={!ready}
            className="icon-btn mobile-menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="marketing-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
