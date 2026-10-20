"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, Menu, ShieldCheck } from "lucide-react";

const links = [
  ["#manfaat", "Kenapa WarrantyIDEA"],
  ["#alur", "Alur penanganan"],
  ["#pertanyaan", "Pertanyaan"],
] as const;

export function SiteHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const desktop = matchMedia("(min-width: 768px)");
    const close = () => {
      if (!menu.current?.open) return;
      const focusedInside = menu.current.contains(document.activeElement);
      menu.current.open = false;
      if (focusedInside) {
        if (desktop.matches)
          header.current
            ?.querySelector<HTMLAnchorElement>(".desktop-nav a")
            ?.focus({ preventScroll: true });
        else
          menu.current.querySelector("summary")?.focus({ preventScroll: true });
      }
    };
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    desktop.addEventListener("change", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      desktop.removeEventListener("change", close);
    };
  }, []);

  return (
    <header className="site-header" ref={header}>
      <div className="container header-inner">
        <a className="wordmark" href="/" aria-label="WarrantyIDEA, beranda">
          <ShieldCheck size={27} strokeWidth={1.8} aria-hidden="true" />
          <span>
            Warranty<span className="wordmark-suffix">IDEA</span>
            <span className="wordmark-dot">.</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {links.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <a className="header-cta" href="#pengguna">
          Untuk siapa? <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <details
          className="mobile-menu"
          ref={menu}
          onKeyDown={(event) => {
            if (event.key === "Escape" && menu.current?.open) {
              event.preventDefault();
              menu.current.open = false;
              menu.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label="Menu navigasi">
            <Menu size={22} aria-hidden="true" />
            <span>Menu</span>
          </summary>
          <nav aria-label="Navigasi mobile">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => {
                  if (menu.current) menu.current.open = false;
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="#pengguna"
              onClick={() => {
                if (menu.current) menu.current.open = false;
              }}
            >
              Untuk siapa?
            </a>
          </nav>
        </details>
      </div>
    </header>
  );
}
