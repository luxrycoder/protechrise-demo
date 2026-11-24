"use client";

import { ART_STYLES, setArtStyle, useArtStyle, type ArtStyle } from "./art-style";
import styles from "./art-switcher.module.css";

const LABELS: Record<ArtStyle, string> = { portraits: "Portraits", peeps: "Open Peeps", humaaans: "Humaaans" };

/** Review-only control for choosing between the three illustration sets. Shown only on the demo deployment. */
export function ArtSwitcher() {
  const current = useArtStyle();
  return (
    <div className={styles.bar} role="group" aria-label="Illustration style">
      <span className={styles.label}>Illustrations</span>
      {ART_STYLES.map((style) => (
        <button key={style} type="button" className={styles.opt} aria-pressed={style === current} onClick={() => setArtStyle(style)}>
          {LABELS[style]}
        </button>
      ))}
    </div>
  );
}
