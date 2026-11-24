"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./sticky-apply-bar.module.css";

/** The root attribute set while the bar is on screen, so other fixed elements (the WhatsApp button) can move clear of it. */
export const STICKY_APPLY_ATTRIBUTE = "data-sticky-apply";

type Props = {
  readonly trackSlug: string;
  readonly trackName: string;
};

/**
 * A bottom "Apply" bar that appears once the hero (and its Apply button) has scrolled out of view, and goes
 * away again when the page's closing call-to-action comes into view, so two Apply prompts never stack.
 * It is not rendered at all until it is needed, so the page is complete without JavaScript.
 */
export function StickyApplyBar({ trackSlug, trackName }: Props) {
  const [heroGone, setHeroGone] = useState(false);
  const [ctaReached, setCtaReached] = useState(false);
  const visible = heroGone && !ctaReached;

  useEffect(() => {
    const hero = document.getElementById("track-title")?.closest("section");
    const cta = document.getElementById("cta-title")?.closest("section");
    if (!hero) return;

    // The hero is "gone" only once it has scrolled up past the top, not merely when it is out of view.
    const heroObserver = new IntersectionObserver(([entry]) => {
      if (entry) setHeroGone(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    heroObserver.observe(hero);

    // "Reached" covers the band being in view and everything after it (the footer), which is scrolled past it.
    const ctaObserver = new IntersectionObserver(([entry]) => {
      if (entry) setCtaReached(entry.isIntersecting || entry.boundingClientRect.top < 0);
    });
    if (cta) ctaObserver.observe(cta);

    return () => {
      heroObserver.disconnect();
      ctaObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.setAttribute(STICKY_APPLY_ATTRIBUTE, "");
    else root.removeAttribute(STICKY_APPLY_ATTRIBUTE);
    return () => root.removeAttribute(STICKY_APPLY_ATTRIBUTE);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={styles.bar} role="region" aria-label="Apply for this track">
      <span className={styles.name}>{trackName}</span>
      <Link href={`/apply?track=${encodeURIComponent(trackSlug)}`} className={`btn btn-primary ${styles.button}`}>
        Apply for this track →
      </Link>
    </div>
  );
}
