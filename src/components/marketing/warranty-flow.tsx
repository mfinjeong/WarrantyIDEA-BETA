"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  FolderOpen,
  PenLine,
  ReceiptText,
  RotateCcw,
  Square,
} from "lucide-react";
import "./warranty-flow.css";

const steps = [
  {
    title: "Masukkan produknya.",
    description:
      "Buat akun, lalu isi nama produk, model, dan nomor seri secara manual.",
    label: "Catat produk",
    icon: PenLine,
  },
  {
    title: "Cek tanggal di nota.",
    description:
      "Tambahkan toko, tanggal beli, dan masa garansi. Preview nota hanya bersifat lokal.",
    label: "Periksa pembelian",
    icon: ReceiptText,
  },
  {
    title: "Lihat saat dibutuhkan.",
    description:
      "Detail dan status garansi tersimpan di arsip akun Anda. Buka lagi sebelum menghubungi toko.",
    label: "Buka arsip",
    icon: FolderOpen,
  },
];

export function WarrantyFlow() {
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState(
    "Pilih langkah untuk melihat contoh pencatatan.",
  );
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const record = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const run = useRef({ token: 0 });
  const autoPlayed = useRef(false);

  const replay = useCallback(async () => {
    const node = record.current;
    if (!node) return;
    const token = ++run.current.token;
    autoPlayed.current = true;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(2);
      setPlaying(false);
      setStatus(
        "Peragaan selesai tanpa gerakan. Pilih langkah untuk membaca detailnya.",
      );
      return;
    }
    setPlaying(true);
    setStatus("Peragaan: catat produk, periksa pembelian, lalu buka arsip.");
    for (let index = 0; index < steps.length; index++) {
      if (token !== run.current.token) return;
      setActive(index);
      const animation = node.animate(
        [
          { transform: "translateY(10px)", opacity: 0.65 },
          { transform: "translateY(0)", opacity: 1, offset: 0.55 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: 1050, easing: "cubic-bezier(.16,1,.3,1)" },
      );
      animations.current.push(animation);
      try {
        await animation.finished;
      } catch {
        return;
      }
    }
    if (token === run.current.token) {
      setPlaying(false);
      setStatus(
        "Peragaan selesai. Detail tercatat; nota tetap Anda simpan sendiri.",
      );
    }
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const sequence = run.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const box = node.getBoundingClientRect();
      const visible =
        !document.hidden && box.bottom > 0 && box.top < innerHeight;
      if (!autoPlayed.current && visible && !preference.matches) {
        const exposed =
          Math.min(box.bottom, innerHeight) - Math.max(box.top, 0);
        if (exposed >= Math.min(box.height, innerHeight) * 0.25) void replay();
      }
      for (const animation of animations.current) {
        if (!visible && animation.playState === "running") animation.pause();
        else if (visible && animation.playState === "paused") animation.play();
      }
    };
    const reduce = () => {
      if (!preference.matches) return;
      sequence.token++;
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      setPlaying(false);
      setStatus("Gerakan dikurangi. Pilih langkah untuk membaca detailnya.");
    };
    const observer = new IntersectionObserver(sync, { threshold: [0, 0.25] });
    observer.observe(node);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", reduce);
    return () => {
      sequence.token++;
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", reduce);
      animations.current.forEach((animation) => animation.cancel());
    };
  }, [replay]);

  function stop() {
    autoPlayed.current = true;
    run.current.token++;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    setPlaying(false);
  }

  function choose(index: number) {
    stop();
    setActive(index);
    setStatus(`Langkah ${index + 1}: ${steps[index].label}.`);
  }

  return (
    <div
      ref={root}
      className="warranty-flow"
      aria-label="Contoh alur pencatatan garansi"
    >
      <div className="flow-visual">
        <div className="flow-rail" aria-hidden="true">
          <svg viewBox="0 0 420 48" preserveAspectRatio="none">
            <path d="M24 24 H396" className="flow-track" />
            <path
              d="M24 24 H396"
              className="flow-connector"
              pathLength="1"
              style={{ strokeDashoffset: 1 - active / 2 }}
            />
          </svg>
          {steps.map((step, index) => (
            <span key={step.label} data-complete={index <= active}>
              <step.icon size={23} />
            </span>
          ))}
        </div>
        <div ref={record} className="flow-record" data-step={active}>
          <div key={active} className="flow-view">
            <p className="flow-fiction">Contoh fiktif · bukan data akun Anda</p>
            <h3>{steps[active].label}</h3>
            {active === 0 ? (
              <dl>
                <div>
                  <dt>Nama produk</dt>
                  <dd>Headphone nirkabel</dd>
                </div>
                <div>
                  <dt>Nomor seri</dt>
                  <dd>DEMO-HP-0082</dd>
                </div>
                <div>
                  <dt>Pengisian</dt>
                  <dd>Dicatat manual oleh Anda</dd>
                </div>
              </dl>
            ) : active === 1 ? (
              <>
                <div className="flow-receipt">
                  <ReceiptText size={22} aria-hidden="true" />
                  <span>
                    NOTA CONTOH<strong>Toko Audio Contoh</strong>
                  </span>
                  <b>Rp1.250.000</b>
                </div>
                <dl>
                  <div>
                    <dt>Tanggal beli</dt>
                    <dd>12 September 2026</dd>
                  </div>
                  <div>
                    <dt>Akhir garansi</dt>
                    <dd>12 September 2027</dd>
                  </div>
                </dl>
                <p className="flow-local-note">
                  Preview lokal; gambar nota tidak disimpan.
                </p>
              </>
            ) : (
              <>
                <div className="flow-file-heading">
                  <FolderOpen size={24} aria-hidden="true" />
                  <strong>Headphone nirkabel</strong>
                </div>
                <dl>
                  <div>
                    <dt>Nomor seri</dt>
                    <dd>DEMO-HP-0082</dd>
                  </div>
                  <div>
                    <dt>Toko</dt>
                    <dd>Toko Audio Contoh</dd>
                  </div>
                  <div>
                    <dt>Akhir garansi</dt>
                    <dd>12 September 2027</dd>
                  </div>
                </dl>
                <p className="flow-recorded">
                  <Check size={17} aria-hidden="true" /> Detail siap dibuka lagi
                  di arsip.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flow-instructions">
        <div className="flow-steps" aria-label="Pilih langkah pencatatan">
          {steps.map((step, index) => (
            <button
              key={step.label}
              type="button"
              aria-pressed={active === index}
              onClick={() => choose(index)}
            >
              <span className="flow-step-number">0{index + 1}</span>
              <span>
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </span>
              <Check className="flow-step-check" size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="flow-controls">
          <button
            type="button"
            onClick={
              playing
                ? () => {
                    stop();
                    setStatus(
                      "Peragaan dihentikan. Pilih langkah atau putar lagi.",
                    );
                  }
                : replay
            }
          >
            {playing ? (
              <Square size={15} aria-hidden="true" />
            ) : (
              <RotateCcw size={16} aria-hidden="true" />
            )}
            {playing ? "Hentikan peragaan" : "Putar peragaan"}
          </button>
          <span>Contoh pengisian manual</span>
        </div>
        <p className="flow-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </div>
  );
}
