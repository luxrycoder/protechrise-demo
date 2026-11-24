"use client";

import { useEffect, useRef, useState } from "react";
import { SHARE_URL } from "@/features/thank-you/thank-you";
import styles from "@/features/thank-you/thank-you.module.css";

const RESET_MS = 2000;

type Label = "Copy link" | "Copied!" | "Copy failed";

export function CopyLinkButton() {
  const [label, setLabel] = useState<Label>("Copy link");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    let next: Label = "Copied!";
    try {
      await navigator.clipboard.writeText(SHARE_URL);
    } catch {
      next = "Copy failed";
    }
    setLabel(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLabel("Copy link"), RESET_MS);
  }

  return (
    <button type="button" className={styles.shareLink} onClick={copy} aria-live="polite">
      {label}
    </button>
  );
}
