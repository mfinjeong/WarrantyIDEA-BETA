"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  Headphones,
  RotateCcw,
  Square,
} from "lucide-react";
import "./aftersales-demo.css";

const roles = ["Pembeli", "Petugas garansi", "Mitra servis"] as const;
const phases = [
  {
    name: "Laporan",
    title: "Satu laporan. Titik awal yang jelas.",
    detail:
      "Headphone contoh · suara kanan terputus. Pembeli menyiapkan kronologi dan bukti pembelian.",
    next: "Pembeli → petugas garansi",
    evidence: "Kronologi keluhan",
    trace: "09.10 · Laporan contoh dibuat",
  },
  {
    name: "Kelengkapan",
    title: "Bukti ikut bergerak, bukan tercecer.",
    detail:
      "Nota contoh dan nomor seri dicocokkan secara manual. Kelengkapan bukan persetujuan klaim.",
    next: "Petugas garansi → mitra servis",
    evidence: "Nota & nomor seri contoh",
    trace: "09.20 · Kelengkapan ditinjau",
  },
  {
    name: "Pemeriksaan",
    title: "Temuan teknis kembali ke pemberi garansi.",
    detail:
      "Mitra servis mencatat hasil pemeriksaan contoh. Tidak ada diagnosis atau penetapan kesalahan otomatis.",
    next: "Mitra servis → petugas garansi",
    evidence: "Catatan pemeriksaan contoh",
    trace: "11.30 · Pemeriksaan dicatat",
  },
  {
    name: "Keputusan",
    title: "Menunggu keputusan pihak berwenang",
    detail:
      "Pemberi garansi meninjau ketentuan dan temuan. Demo ini tidak menyetujui atau menolak klaim.",
    next: "Petugas garansi → pembeli",
    evidence: "Ringkasan untuk peninjauan",
    trace: "13.00 · Menunggu peninjauan keputusan",
  },
  {
    name: "Pengembalian",
    title: "Langkah akhir tetap punya penanggung jawab.",
    detail:
      "Contoh rencana pengembalian setelah keputusan dan tindak lanjut disepakati. Bukan bukti barang telah dikirim.",
    next: "Mitra servis → pembeli",
    evidence: "Rencana serah terima contoh",
    trace: "Berikutnya · Pengembalian direncanakan",
  },
];
const routes = [
  [65, 260],
  [260, 455],
  [455, 260],
  [260, 65],
  [455, 65],
] as const;
const roleDetails = [
  "Ikuti posisi laporan dan siapa yang perlu bertindak berikutnya. Bukti asli tetap Anda simpan sendiri.",
  "Tinjau kelengkapan, teruskan catatan ke mitra, lalu dokumentasikan keputusan pihak berwenang.",
  "Baca keluhan dan catat temuan pemeriksaan untuk ditinjau pemberi garansi; bukan otorisasi perbaikan.",
];

export function AftersalesDemo() {
  const [role, setRole] = useState(1);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState(
    "Pilih tahap untuk menelusuri satu kasus contoh.",
  );
  const root = useRef<HTMLElement>(null);
  const motion = useRef({
    animations: [] as Animation[],
    token: 0,
    started: false,
  });
  const stop = useCallback(() => {
    motion.current.token++;
    motion.current.animations.forEach((animation) => animation.cancel());
    motion.current.animations = [];
    setPlaying(false);
  }, []);

  const replay = useCallback(async () => {
    stop();
    setPhase(0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase(4);
      setMessage(
        "Alur contoh ditampilkan tanpa animasi. Semua tahap dapat dipilih.",
      );
      return;
    }
    const sequence = motion.current;
    const token = ++sequence.token;
    setPlaying(true);
    setMessage("Memperagakan perpindahan catatan antarpihak.");
    for (let index = 0; index < phases.length; index++) {
      if (token !== sequence.token) return;
      setPhase(index);
      const node = root.current;
      if (!node) return;
      const definitions: [string, Keyframe[]][] = [
        [".af-route-line", [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }]],
        [
          ".af-traveller",
          [
            {
              transform: `translateX(${routes[index][0] - 260}px)`,
              opacity: 0,
            },
            { opacity: 1, offset: 0.2 },
            {
              transform: `translateX(${routes[index][1] - 260}px)`,
              opacity: 0,
            },
          ],
        ],
        [
          ".af-evidence",
          [
            { transform: "translateY(12px)", clipPath: "inset(0 0 85% 0)" },
            { transform: "translateY(0)", clipPath: "inset(0)" },
          ],
        ],
        [
          ".af-stamp",
          [
            { transform: "scale(1.18) rotate(-8deg)" },
            { transform: "scale(1) rotate(-3deg)" },
          ],
        ],
      ];
      const batch = definitions.flatMap(([selector, frames]) => {
        const target = node.querySelector(selector);
        return target
          ? [
              target.animate(frames, {
                duration: 840,
                easing: "cubic-bezier(.16,1,.3,1)",
              }),
            ]
          : [];
      });
      sequence.animations = batch;
      const rect = node.getBoundingClientRect();
      if (document.hidden || rect.bottom <= 0 || rect.top >= innerHeight)
        batch.forEach((animation) => animation.pause());
      try {
        await Promise.all(batch.map((animation) => animation.finished));
      } catch {
        return;
      }
    }
    if (token === sequence.token) {
      setPlaying(false);
      setMessage(
        "Alur contoh selesai. Pilih peran atau tahap untuk melihat rinciannya.",
      );
    }
  }, [stop]);

  useEffect(() => {
    const node = root.current;
    const sequence = motion.current;
    if (!node) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const rect = node.getBoundingClientRect();
      const paused =
        document.hidden || rect.bottom <= 0 || rect.top >= innerHeight;
      sequence.animations.forEach((animation) => {
        if (paused && animation.playState === "running") animation.pause();
        else if (!paused && animation.playState === "paused") animation.play();
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !sequence.started) {
        sequence.started = true;
        if (!media.matches) void replay();
      }
      sync();
    });
    const reduce = () => {
      if (media.matches) {
        stop();
        setMessage("Gerak dikurangi. Semua tahap tetap dapat dipilih.");
      }
    };
    observer.observe(node);
    media.addEventListener("change", reduce);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", reduce);
      document.removeEventListener("visibilitychange", sync);
      sequence.token++;
      sequence.animations.forEach((animation) => animation.cancel());
    };
  }, [replay, stop]);

  function select(index: number, kind: "role" | "phase") {
    motion.current.started = true;
    stop();
    if (kind === "role") setRole(index);
    else setPhase(index);
    setMessage(
      "Pilihan diperbarui. Putar ulang untuk melihat perpindahan catatan.",
    );
  }
  const current = phases[phase];
  return (
    <section
      ref={root}
      id="contoh-arsip"
      className="af-demo"
      aria-label="Demo alur purnajual"
      data-playing={playing}
    >
      <header className="af-top">
        <span>Simulasi interaktif · data fiktif</span>
        <span className="af-case-id">DEMO-WI-2048</span>
      </header>
      <div className="af-heading">
        <div>
          <h2>Satu kasus, tiga sudut pandang.</h2>
          <p>Coba alur koordinasi purnajual.</p>
        </div>
        <Headphones size={35} aria-hidden="true" />
      </div>
      <div className="af-roles" aria-label="Pilih sudut pandang">
        {roles.map((name, index) => (
          <button
            key={name}
            type="button"
            aria-pressed={role === index}
            onClick={() => select(index, "role")}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="af-playback af-toolbar">
        <button type="button" onClick={() => void replay()}>
          <RotateCcw size={16} aria-hidden="true" />
          Putar ulang alur
        </button>
        <button
          type="button"
          onClick={() => {
            stop();
            setMessage("Pemutaran dihentikan. Anda dapat memilih tahap.");
          }}
          disabled={!playing}
        >
          <Square size={13} aria-hidden="true" />
          Hentikan
        </button>
      </div>
      <div className="af-route" aria-hidden="true">
        <svg viewBox="0 0 520 104">
          <path className="af-route-base" d="M65 39H455" />
          <path
            className="af-route-line"
            pathLength="1"
            d={`M${routes[phase][0]} 39H${routes[phase][1]}`}
          />
          <g className="af-traveller">
            <rect x="247" y="21" width="26" height="35" rx="3" />
            <path d="M253 31h14m-14 6h14m-14 6h8" />
          </g>
          {[65, 260, 455].map((x, index) => (
            <g
              key={x}
              className={index === role ? "af-node af-node-active" : "af-node"}
            >
              <circle cx={x} cy="39" r="17" />
              <path d={`M${x - 6} 39h12m-6-6v12`} />
              <text x={x} y="83" textAnchor="middle">
                {roles[index]}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="af-stages" aria-label="Tahap kasus">
        {phases.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={phase === index}
            onClick={() => select(index, "phase")}
          >
            <span aria-hidden="true">{index + 1}</span>
            {item.name}
          </button>
        ))}
      </div>
      <div className="af-scene">
        <div className="af-scene-top">
          <span>HEADPHONE CONTOH · HP-0082</span>
          <span className="af-stamp">{current.name}</span>
        </div>
        <h3>{current.title}</h3>
        <p className="af-description">{current.detail}</p>
        <div className="af-evidence">
          <FileText size={19} aria-hidden="true" />
          <span>
            {current.evidence}
            <small>Ilustrasi dokumen · tidak diunggah atau disimpan</small>
          </span>
        </div>
        <p className="af-handoff">
          <span>Giliran berikutnya</span>
          <strong>{current.next}</strong>
          <ArrowRight size={18} aria-hidden="true" />
        </p>
      </div>
      <div className="af-perspective">
        <strong>Tampilan {roles[role].toLowerCase()}</strong>
        <p data-testid="role-detail">{roleDetails[role]}</p>
      </div>
      <details className="af-trace">
        <summary>Jejak kasus contoh</summary>
        <ol data-testid="case-trace">
          {phases.slice(0, phase + 1).map((item) => (
            <li key={item.name}>{item.trace}</li>
          ))}
        </ol>
      </details>
      <footer className="af-footer">
        <p role="status">{message}</p>
        <p className="af-limit">Belum terhubung ke sistem klaim</p>
      </footer>
    </section>
  );
}
