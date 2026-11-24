"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categoriesOf, type Track } from "@/lib/track-filters";
import styles from "./site-header.module.css";

const CURRICULUM = "/tracks";

/** "Tracks" nav item with a dropdown. Each entry jumps to the curriculum section; categories also pre-select that filter. */
export function NavTracks({ label, tracks }: { readonly label: string; readonly tracks: readonly Track[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const categories = categoriesOf(tracks);
  if (categories.length === 0) return <Link href={CURRICULUM}>{label}</Link>;

  return (
    <div className={styles.dropdown} ref={root} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className={styles.dropdownBtn} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true" className={open ? styles.caretOpen : ""}>
          <path d="M2 4.5 L6 8.5 L10 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul className={styles.menu}>
          <li>
            <Link href={CURRICULUM} className={styles.menuAll} onClick={() => setOpen(false)}>
              All tracks
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category}>
              <Link href={`/tracks?category=${encodeURIComponent(category)}`} onClick={() => setOpen(false)}>
                {category}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
