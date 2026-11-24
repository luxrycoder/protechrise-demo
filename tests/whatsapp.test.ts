import { describe, expect, test } from "vitest";
import { CONTACT } from "@/content/contact";
import { whatsappHref } from "@/lib/whatsapp";

describe("whatsappHref", () => {
  test("builds a wa.me link with the message URL-encoded", () => {
    expect(whatsappHref("2348012345678", "Hi! I'd like to know more.")).toBe(
      "https://wa.me/2348012345678?text=Hi!%20I'd%20like%20to%20know%20more.",
    );
  });

  test("returns null for the placeholder and for anything that is not a real E.164 number, so the button is hidden", () => {
    for (const number of ["<pending>", "", "+2348012345678", "234 801 234 5678", "08012345678", "12345", "23480123456789012", "abc"]) {
      expect(whatsappHref(number, "hi")).toBeNull();
    }
  });
});

describe("contact content", () => {
  test("the configured number opens a chat with +234 916 000 4656", () => {
    const { number, defaultMessage } = CONTACT.whatsapp;
    expect(whatsappHref(number, defaultMessage)).toBe(
      `https://wa.me/2349160004656?text=${encodeURIComponent(defaultMessage)}`,
    );
  });

  test("the configured WhatsApp number is a valid number, never a half-filled one", () => {
    const { defaultMessage } = CONTACT.whatsapp;
    const number: string = CONTACT.whatsapp.number;
    expect(whatsappHref(number, defaultMessage)).not.toBeNull();
  });
});
