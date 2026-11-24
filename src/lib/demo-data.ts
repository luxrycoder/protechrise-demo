import demo from "@/content/demo-data.json";

/**
 * Demo deployment switch. When DEMO_DATA=1 the public pages read the pre-stored JSON in src/content/demo-data.json instead of
 * calling the waitlist API, so the site can be shown with no backend. Never set it on a real environment.
 */
export function demoDataEnabled(): boolean {
  return process.env.DEMO_DATA === "1";
}

export const DEMO_PAYLOADS = demo;
