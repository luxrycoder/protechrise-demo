export type NavLink = { readonly label: string; readonly href: string };

// Single source of truth for navigation; header and footer both read from here.
export const NAV_LINKS: readonly NavLink[] = [
  { label: "Tracks", href: "/#tracks" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/faq" },
  // Signed-in learners reach the LMS from the status page: the LMS address only ever comes from the hand-off request.
  { label: "Student LMS", href: "/status" },
];

export const FOOTER_LINKS: readonly NavLink[] = [
  { label: "FAQ", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refund policy", href: "/refund-policy" },
];

/**
 * Static pages advertised in the sitemap. /apply is left out until the real application flow
 * replaces the placeholder, so a thin page is not offered to search engines.
 */
export const SITEMAP_STATIC_PATHS: readonly string[] = ["/", "/tracks", "/faq", "/privacy", "/refund-policy"];
