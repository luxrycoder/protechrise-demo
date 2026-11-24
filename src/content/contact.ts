// Contact details used site-wide (not homepage-specific, so kept out of home.ts).

export const CONTACT = {
  whatsapp: {
    /**
     * E.164 digits only: no "+", no spaces, e.g. "2348012345678". If this is ever set back to "<pending>" (or
     * anything that is not a valid number) the floating button renders nothing (see src/lib/whatsapp.ts).
     */
    number: "2349160004656", // +234 916 000 4656
    defaultMessage: "Hi! I'd like to know more about ProTech Rise Academy.",
  },
} as const;
