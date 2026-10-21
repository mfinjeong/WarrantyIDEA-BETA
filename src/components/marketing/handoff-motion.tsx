"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Playback =
  "ready" | "running" | "paused" | "complete" | "stopped" | "reduced";
const labels: Record<Playback, string> = {
  ready: "Alur siap",
  running: "Menghubungkan",
  paused: "Dijeda",
  complete: "Alur lengkap",
  stopped: "Dihentikan",
  reduced: "Tanpa gerakan",
};

export function HandoffMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const runtime = useRef({
    animations: [] as Animation[],
    token: 0,
    introduced: false,
    visible: false,
    play: () => {},
    stop: () => {},
  });
  const [playback, setPlayback] = useState<Playback>("ready");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const node = root.current!;
    const state = runtime.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const scene = node.querySelector<HTMLElement>(".handoff-scene")!;
    const packet = node.querySelector<HTMLElement>(".handoff-packet")!;
    let disposed = false;
    const cancel = () => {
      state.token += 1;
      state.animations.forEach((animation) => animation.cancel());
      state.animations = [];
    };
    const sync = () => {
      if (!state.animations.length) return;
      const paused = !state.visible || document.hidden;
      state.animations.forEach((animation) => {
        if (paused && animation.playState === "running") animation.pause();
        else if (!paused && animation.playState === "paused") animation.play();
      });
      setPlayback(paused ? "paused" : "running");
    };
    const play = () => {
      cancel();
      if (reduced.matches) {
        setPlayback("reduced");
        return;
      }
      const token = state.token;
      const bounds = scene.getBoundingClientRect();
      const box = (selector: string) => {
        const rect = scene.querySelector(selector)!.getBoundingClientRect();
        return {
          x: rect.x - bounds.x,
          y: rect.y - bounds.y,
          w: rect.width,
          h: rect.height,
        };
      };
      const a = box(".evidence-object"),
        b = box(".inspection-object"),
        c = box(".response-object");
      const mobile = matchMedia("(max-width: 767px)").matches;
      // Both the drawn route and travelling document use these same measured endpoints.
      const route = mobile
        ? `M${a.x + a.w / 2} ${a.y + a.h - 15} L${b.x + b.w / 2} ${b.y + 20} L${b.x + b.w / 2} ${b.y + b.h - 10} L${c.x + c.w / 2} ${c.y + 20}`
        : `M${a.x + a.w - 25} ${a.y + a.h / 2} H${b.x + 25} V${b.y + b.h + 24} H${c.x - 24} V${c.y + c.h / 2} H${c.x + 20}`;
      const svg = scene.querySelector<SVGSVGElement>(".handoff-route")!;
      svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
      svg
        .querySelectorAll("path")
        .forEach((path) => path.setAttribute("d", route));
      packet.style.offsetPath = `path('${route}')`;
      const add = (
        target: Element | null,
        frames: Keyframe[],
        duration: number,
        delay = 0,
      ) => {
        if (!target) return;
        const animation = target.animate(frames, {
          duration,
          delay,
          easing: "cubic-bezier(.16,1,.3,1)",
          fill: "both",
        });
        state.animations.push(animation);
      };
      add(
        scene.querySelector(".evidence-object"),
        [
          { transform: "translate(-12px, 0) rotate(-8deg)" },
          {
            transform: getComputedStyle(
              scene.querySelector(".evidence-object")!,
            ).transform,
          },
        ],
        900,
      );
      add(
        packet,
        [
          { offsetDistance: "0%", opacity: 0 },
          { offsetDistance: "0%", opacity: 1, offset: 0.06 },
          { offsetDistance: "44%", opacity: 1, offset: 0.46 },
          { offsetDistance: "90%", opacity: 1, offset: 0.9 },
          { offsetDistance: "100%", opacity: 0 },
        ],
        4400,
      );
      add(
        scene.querySelector(".route-trace"),
        [{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }],
        3900,
        250,
      );
      add(
        scene.querySelector(".inspection-annotation"),
        [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
        1000,
        1700,
      );
      add(
        scene.querySelector(".response-stamp"),
        [
          { transform: "rotate(-3deg) scale(.94)" },
          { transform: "rotate(-5deg) scale(1)" },
        ],
        800,
        3600,
      );
      add(
        scene.querySelector(".response-object"),
        [{ translate: "0 -10px" }, { translate: "0 0" }],
        800,
        3600,
      );
      setPlayback("running");
      sync();
      void Promise.all(state.animations.map((animation) => animation.finished))
        .then(() => {
          if (disposed || token !== state.token) return;
          cancel();
          setPlayback("complete");
        })
        .catch(() => {
          /* Cancellation is an intentional lifecycle transition. */
        });
    };
    state.play = play;
    state.stop = () => {
      cancel();
      setPlayback("stopped");
    };
    const preference = () => {
      if (reduced.matches) {
        cancel();
        setPlayback("reduced");
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        setEnabled(true);
        state.visible = entry.isIntersecting;
        if (state.visible && !state.introduced) {
          state.introduced = true;
          play();
        } else sync();
      },
      { threshold: 0.12 },
    );
    observer.observe(scene);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", preference);
    // Reflow invalidates measured routes. Never continue along a stale desktop path.
    const resize = () => {
      if (state.animations.length) state.stop();
    };
    window.addEventListener("resize", resize);
    return () => {
      disposed = true;
      cancel();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", preference);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <figure
      ref={root}
      className="handoff"
      data-playback={playback}
      aria-label="Contoh hubungan bukti, pemeriksaan, dan tanggapan garansi"
    >
      <figcaption className="handoff-caption">
        <div>
          <span>Satu barang. Konteksnya ikut sampai akhir.</span>
          <small>Contoh ilustratif · bukan klaim nyata</small>
        </div>
        <div className="motion-tools" hidden={!enabled}>
          <span className="motion-status" aria-live="polite">
            {labels[playback]}
          </span>
          <div className="motion-controls">
            <button type="button" onClick={() => runtime.current.play()}>
              Putar ulang
            </button>
            <button type="button" onClick={() => runtime.current.stop()}>
              Hentikan
            </button>
          </div>
        </div>
      </figcaption>
      {children}
    </figure>
  );
}
