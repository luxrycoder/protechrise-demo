"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type From = "up" | "left" | "right" | "fade";

/**
 * Fades and slides its children in once, when they scroll into view. Content is fully visible until the page has
 * hydrated (and for anything already on screen), so nothing is hidden without JavaScript. Honours reduced motion in CSS.
 */
export function Reveal({ children, from = "up", delay = 0, className }: { readonly children: ReactNode; readonly from?: From; readonly delay?: number; readonly className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.dataset.reveal = "hidden";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.reveal = "shown";
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} data-from={from} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
