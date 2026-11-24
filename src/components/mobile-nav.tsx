"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { NavLink } from "@/lib/site";
import styles from "./site-header.module.css";

/** Matches the breakpoint where the header hides its inline nav. */
const DESKTOP_QUERY = "(min-width: 761px)";

/**
 * The header's nav links on phones: a menu button that opens a panel under the header. Closes on a link
 * tap, on Escape (returning focus to the button), and if the screen grows to the desktop layout.
 */
export function MobileNav({ links }: { readonly links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      document.getElementById(`${panelId}-button`)?.focus();
    };
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => media.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    media.addEventListener("change", onChange);
    return () => {
      document.removeEventListener("keydown", onKey);
      media.removeEventListener("change", onChange);
    };
  }, [open, panelId]);

  return (
    <div className={styles.mobileNav}>
      <button
        type="button"
        id={`${panelId}-button`}
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span className={styles.menuIcon} aria-hidden="true" data-open={open} />
      </button>
      <nav id={panelId} aria-label="Primary mobile" className={styles.menuPanel} hidden={!open}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
