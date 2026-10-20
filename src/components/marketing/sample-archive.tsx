"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AftersalesDemo } from "./aftersales-demo";

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
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (!node) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!media.matches)
            animation = node.animate(
              [
                { clipPath: "inset(0 0 12% 0)", opacity: 0.65 },
                { clipPath: "inset(0)", opacity: 1 },
              ],
              { duration: 550, easing: "cubic-bezier(.16,1,.3,1)" },
            );
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    const reduce = () => {
      if (media.matches) animation?.cancel();
    };
    observer.observe(node);
    media.addEventListener("change", reduce);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", reduce);
      animation?.cancel();
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function SampleArchive() {
  return <AftersalesDemo />;
}
