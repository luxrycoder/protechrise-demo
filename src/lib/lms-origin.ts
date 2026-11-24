import { parseLmsOrigin } from "@/lib/portal";

/**
 * The LMS origin (`LMS_ORIGIN`, for example `https://learn.protechrise.com`): the only place this site will ever send a
 * learner with a one-time hand-off ticket. Read on the server at request time and passed to the pages that need it.
 * Set it to the same value as waitlist-api's `LMS_DASHBOARD_URL`. Missing or invalid means null, and the hand-off
 * then fails closed (the LMS button is not offered). Plain http on this machine is accepted outside production only.
 */
export function loadLmsOrigin(raw: Record<string, string | undefined> = process.env): string | null {
  return parseLmsOrigin(raw.LMS_ORIGIN, raw.NODE_ENV !== "production");
}
