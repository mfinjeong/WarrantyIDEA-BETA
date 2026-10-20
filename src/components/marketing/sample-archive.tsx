"use client";

import Image from "next/image";
import { WarrantyRange } from "./warranty-range";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Camera,
  Headphones,
  RotateCcw,
  Check,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";

const samples = [
  {
    name: "Headphone nirkabel",
    short: "Headphone",
    image: "/images/headphones.jpg",
    alt: "Headphone hitam di atas meja berwarna netral",
    serial: "DEMO-HP-0082",
    shop: "Toko Audio Contoh",
    price: "Rp1.250.000",
    bought: "12 September 2026",
    ends: "12 September 2027",
    day: "12",
    month: "SEP 2027",
    icon: Headphones,
  },
  {
    name: "Kamera mirrorless",
    short: "Kamera",
    image: "/images/camera.jpg",
    alt: "Kamera dan lensa di atas permukaan gelap",
    serial: "DEMO-CAM-0147",
    shop: "Toko Kamera Contoh",
    price: "Rp8.500.000",
    bought: "24 Agustus 2026",
    ends: "24 Oktober 2028",
    day: "24",
    month: "OKT 2028",
    icon: Camera,
  },
];

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.animate(
            [
              { clipPath: "inset(0 0 18% 0)", opacity: 0.45 },
              { clipPath: "inset(0)", opacity: 1 },
            ],
            { duration: 650, easing: "cubic-bezier(.16,1,.3,1)" },
          );
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function SampleArchive() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState(
    "Pilih barang untuk melihat isi arsipnya.",
  );
  const stage = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const run = useRef(0);
  const sample = samples[selected];

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const sync = () => {
      const box = node.getBoundingClientRect();
      const pause =
        document.hidden || box.bottom <= 0 || box.top >= innerHeight;
      animations.current.forEach((a) => {
        if (a.playState === "running" && pause) a.pause();
        else if (a.playState === "paused" && !pause) a.play();
      });
    };
    const observer = new IntersectionObserver(sync);
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      animations.current.forEach((a) => a.cancel());
    };
  }, []);

  function choose(index: number) {
    run.current++;
    animations.current.forEach((a) => a.cancel());
    animations.current = [];
    setPlaying(false);
    setSelected(index);
    setStatus(`Contoh arsip ${samples[index].short.toLowerCase()} dipilih.`);
  }

  async function replay() {
    const token = ++run.current;
    animations.current.forEach((a) => a.cancel());
    animations.current = [];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStatus(
        "Simulasi selesai: detail produk dan tanggal garansi sudah dicatat. Nota tetap Anda simpan sendiri.",
      );
      return;
    }
    setPlaying(true);
    setStatus(
      "Simulasi: memeriksa nota, mencatat produk, lalu menandai tanggal garansi.",
    );
    const node = stage.current;
    if (!node) return;
    const palette = getComputedStyle(node);
    const surface = palette.getPropertyValue("--surface").trim();
    const emphasis = palette.getPropertyValue("--brand-soft").trim();
    const targets = [".sample-receipt", ".sample-details", ".sample-calendar", ".sample-range"];
    for (const selector of targets) {
      if (token !== run.current) return;
      const el = node.querySelector(selector);
      if (!el) continue;
      const frames: Keyframe[] =
        selector === ".sample-receipt"
          ? [
              { transform: "translateY(0) scale(1)", opacity: 1 },
              {
                transform: "translateY(54px) scale(.86)",
                opacity: 0.25,
                offset: 0.65,
              },
              { transform: "translateY(0) scale(1)", opacity: 1 },
            ]
          : selector === ".sample-details"
            ? [
                { clipPath: "inset(0 0 85% 0)", background: emphasis },
                { clipPath: "inset(0)", background: surface },
              ]
            : selector === ".sample-range"
              ? [
                  { clipPath: "inset(0 90% 0 0)" },
                  { clipPath: "inset(0)" },
                ]
            : [
                { transform: "rotateY(-65deg)", opacity: 0.3 },
                { transform: "rotateY(0deg)", opacity: 1 },
              ];
      const animation = el.animate(frames, {
        duration: 700,
        easing: "cubic-bezier(.16,1,.3,1)",
      });
      animations.current.push(animation);
      try {
        await animation.finished;
      } catch {
        return;
      }
    }
    if (token === run.current) {
      setPlaying(false);
      setStatus(
        "Simulasi selesai. Detail dan tanggal tercatat; nota tetap Anda simpan sendiri.",
      );
    }
  }

  return (
    <div id="contoh-arsip" className="sample-archive">
      <div className="sample-toolbar">
        <span>COBA ISI ARSIPNYA</span>
        <span>Data fiktif · bukan akun Anda</span>
      </div>
      <div className="sample-choices" aria-label="Pilih contoh produk">
        {samples.map((item, i) => (
          <button
            key={item.short}
            type="button"
            aria-pressed={selected === i}
            onClick={() => choose(i)}
          >
            <item.icon size={18} />
            {item.short}
            <span>
              {selected === i ? (
                <Check size={16} />
              ) : (
                <ArrowUpRight size={16} aria-hidden="true" />
              )}
            </span>
          </button>
        ))}
      </div>
      <div ref={stage} className="sample-stage">
        <div key={selected} className="sample-content">
          <div className="sample-photo">
            <Image
              src={sample.image}
              alt={sample.alt}
              width={900}
              height={700}
              priority={selected === 0}
              sizes="(max-width: 760px) 100vw, 48vw"
            />
            <span>FOTO ILUSTRASI</span>
          </div>
          <div className="sample-paper-tray">
            <div className="sample-receipt">
              <span>NOTA CONTOH</span>
              <strong>{sample.shop}</strong>
              <p>{sample.bought}</p>
              <div>
                {sample.short}
                <b>{sample.price}</b>
              </div>
              <span className="sample-barcode" aria-hidden="true" />
              <small>Ilustrasi nota · tidak disimpan</small>
            </div>
            <div className="sample-calendar">
              <CalendarDays size={19} />
              <span>GARANSI SAMPAI</span>
              <strong>{sample.day}</strong>
              <b>{sample.month}</b>
            </div>
          </div>
          <div className="sample-details">
            <div>
              <span>DETAIL PRODUK CONTOH</span>
              <h2>{sample.name}</h2>
            </div>
            <dl>
              <div>
                <dt>Nomor seri</dt>
                <dd>{sample.serial}</dd>
              </div>
              <div>
                <dt>Tanggal beli</dt>
                <dd>{sample.bought}</dd>
              </div>
              <div>
                <dt>Akhir garansi</dt>
                <dd>{sample.ends}</dd>
              </div>
            </dl>
            <WarrantyRange bought={sample.bought} ends={sample.ends} />
          </div>
        </div>
      </div>
      <div className="sample-replay">
        <button type="button" onClick={replay} disabled={playing}>
          <RotateCcw size={16} />
          {playing ? "Sedang memperagakan…" : "Putar alur pencatatan"}
        </button>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </div>
  );
}
