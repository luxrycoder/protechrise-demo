"use client";

import { useEffect, useRef, useState } from "react";

/** 0 when the element's top reaches 70% of the viewport, 1 when its bottom does: how far the visitor has read through it. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const calc = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = (vh * 0.7 - r.top) / (r.height - vh * 0.2);
      setProgress(Math.max(0, Math.min(1, t)));
    };
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    calc();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return [ref, progress] as const;
}
