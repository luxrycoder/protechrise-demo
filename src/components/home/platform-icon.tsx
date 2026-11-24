import { PLATFORM_LABELS, type Platform } from "@/lib/testimonial-segments";

export function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform];
}

/** Inline SVG logos — no icon library elsewhere in this repo (see global-reach.tsx). */
export function PlatformIcon({ platform }: { readonly platform: Platform }) {
  switch (platform) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.556V9h3.558v11.452z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6V13h2.8v8z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M16.6 5.82c-.9-.95-1.4-2.19-1.4-3.46h-3.1v13.8a3.14 3.14 0 1 1-2.2-3 3.1 3.1 0 0 1 .9.13V9.9a6.2 6.2 0 1 0 5.3 6.14V9.68a9.3 9.3 0 0 0 5.4 1.73V8.37c-1.72 0-3.3-.57-4.9-2.55z" />
        </svg>
      );
  }
}
