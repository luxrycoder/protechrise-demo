"use client";

import { useSyncExternalStore } from "react";

/** The three illustration styles under review. The chosen one is kept in the address (?art=) and in localStorage. */
export const ART_STYLES = ["portraits", "peeps", "humaaans"] as const;
export type ArtStyle = (typeof ART_STYLES)[number];
export const DEFAULT_ART: ArtStyle = "portraits";

const KEY = "protech-art";
const listeners = new Set<() => void>();

const valid = (value: string | null): value is ArtStyle => ART_STYLES.includes(value as ArtStyle);

function read(): ArtStyle {
  const fromUrl = new URLSearchParams(window.location.search).get("art");
  if (valid(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (valid(stored)) return stored;
  } catch {
    // Storage can be blocked; the default is fine.
  }
  return DEFAULT_ART;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setArtStyle(style: ArtStyle) {
  try {
    window.localStorage.setItem(KEY, style);
  } catch {
    // Not persisted; the address still carries the choice.
  }
  const url = new URL(window.location.href);
  url.searchParams.set("art", style);
  window.history.replaceState(null, "", url);
  listeners.forEach((l) => l());
}

export function useArtStyle(): ArtStyle {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_ART);
}
