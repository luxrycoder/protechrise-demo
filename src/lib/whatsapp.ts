// Pure helper for the floating WhatsApp button; no server-only imports.

/** E.164 without the plus: 8 to 15 digits, no leading zero. */
const E164_DIGITS = /^[1-9]\d{7,14}$/;

/**
 * The wa.me link for a number and a pre-filled message, or null when the number is not a real E.164 number
 * (including the "<pending>" placeholder). A null result means the button is hidden: it never shows a link that
 * would open a chat with the wrong person, or with nobody.
 */
export function whatsappHref(number: string, message: string): string | null {
  if (!E164_DIGITS.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
