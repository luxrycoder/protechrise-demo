import type { PortalGate, PortalHome, PortalHomeResponse, PortalSupport, PortalTask } from "@/lib/api/schemas/portal";

/**
 * Pure helpers for the learner portal (issue #46). No React, no network: everything here is unit tested.
 * Staff-written text is rendered as text only; links go through `safeLink` / `safeSupportUrl` first.
 */

export const DEFAULT_COHORT_TIMEZONE = "Africa/Lagos";
export const DEFAULT_RETRY_SECONDS = 30;
/** Never poll faster than this, whatever the server says. */
export const MIN_RETRY_SECONDS = 10;
/** Never wait longer than this between polls. */
export const MAX_RETRY_SECONDS = 300;

export const BEING_ASSIGNED = "Being assigned";
export const DEFAULT_SUPPORT_TEXT = "Reply to your payment receipt email and we will sort it out.";

/** Pages of our own that a staff-written link may point to. */
const OWN_PAGES: readonly string[] = ["/community", "/status", "/portal"];

/** A link from staff-written content: https, or one of our own pages. Anything else (javascript:, http:, data:) is dropped. */
export function safeLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const link = value.trim();
  if (OWN_PAGES.includes(link)) return link;
  if (!/^https:\/\//i.test(link)) return null;
  try {
    const url = new URL(link);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The support link from the server: https or mailto only, no credentials. */
export function safeSupportUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const link = value.trim();
  if (/^mailto:[^\s]+$/i.test(link)) return link;
  return /^https:\/\//i.test(link) ? safeLink(link) : null;
}

export type SupportView = { readonly text: string; readonly url: string | null };

export function supportView(support: PortalSupport | null | undefined): SupportView {
  const text = support?.text?.trim();
  return { text: text || DEFAULT_SUPPORT_TEXT, url: safeSupportUrl(support?.url) };
}

const TICKET_FRAGMENT = /^#[A-Za-z0-9_-]{43}$/;
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);
const HANDOFF_PATH = "/academy/handoff";

/**
 * The LMS origin this site may hand a learner to (the `LMS_ORIGIN` setting): an origin only, https, no path, query,
 * fragment or credentials. Plain http is accepted only for this machine and only when `allowLoopbackHttp` is true
 * (never in a production build). Anything else, including a missing value, is `null`: the hand-off then fails closed.
 * This mirrors how waitlist-api reads `LMS_DASHBOARD_URL` before it will mint a ticket.
 */
export function parseLmsOrigin(value: unknown, allowLoopbackHttp = false): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || /[\s\u0000-\u001f\u007f\\]/.test(text)) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const secure = url.protocol === "https:" || (allowLoopbackHttp && url.protocol === "http:" && LOOPBACK.has(url.hostname));
  if (!secure || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
  return url.origin;
}

/**
 * The LMS hand-off address to navigate to, or null. It must be on exactly `lmsOrigin` (scheme, host and port), at the
 * hand-off path, with no query or credentials and a ticket-shaped fragment. With no configured origin nothing is
 * accepted. Returns the parsed `href`, never the raw string, so what is checked is what the browser opens.
 * The address carries a secret in its fragment: do not log, store or send it anywhere.
 */
export function handoffHref(value: unknown, lmsOrigin: string | null | undefined): string | null {
  if (typeof value !== "string" || !lmsOrigin) return null;
  if (/[\s\u0000-\u001f\u007f\\]/.test(value)) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const ok = url.origin === lmsOrigin && url.pathname === HANDOFF_PATH && !url.search && !url.username && !url.password && TICKET_FRAGMENT.test(url.hash);
  return ok ? url.href : null;
}

/** A valid IANA time zone name, or `fallback`. A bad value must never throw in `Intl`. */
export function validTimeZone(name: unknown, fallback: string | null = DEFAULT_COHORT_TIMEZONE): string | null {
  if (typeof name !== "string" || !name) return fallback;
  try {
    new Intl.DateTimeFormat("en", { timeZone: name });
    return name;
  } catch {
    return fallback;
  }
}

/** Epoch milliseconds for an ISO instant, or null when missing or unparseable. */
export function instantMs(iso: unknown): number | null {
  if (typeof iso !== "string" || !iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Plain words, never negative: "68 days, 2 hours", then hours and minutes, then "Classes have started". */
export function countdownText(startsAtIso: unknown, nowMs: number): string {
  const startsAt = instantMs(startsAtIso);
  if (startsAt === null) return "To be confirmed";
  const remaining = startsAt - nowMs;
  if (!(remaining > 0)) return "Classes have started";
  const minutes = Math.floor(remaining / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${plural(days, "day")}, ${plural(hours, "hour")}`;
  if (hours > 0) return `${plural(hours, "hour")}, ${plural(mins, "minute")}`;
  return plural(Math.max(mins, 1), "minute");
}

const zoneLabel = (timeZone: string) => (timeZone === DEFAULT_COHORT_TIMEZONE ? " WAT" : "");

function format(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).format(new Date(iso));
}

const FULL: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" };

/** "Monday 3 February 2027 at 09:00 WAT"; null when the instant is missing or invalid. */
export function formatInstant(iso: unknown, timeZone: unknown): string | null {
  const ms = instantMs(iso);
  if (ms === null) return null;
  const zone = validTimeZone(timeZone) ?? DEFAULT_COHORT_TIMEZONE;
  return `${format(new Date(ms).toISOString(), zone, FULL)}${zoneLabel(zone)}`.trim();
}

/** "3 February 2027" in the given zone; null when missing or invalid. */
export function formatDay(iso: unknown, timeZone: unknown): string | null {
  const ms = instantMs(iso);
  if (ms === null) return null;
  const zone = validTimeZone(timeZone) ?? DEFAULT_COHORT_TIMEZONE;
  return format(new Date(ms).toISOString(), zone, { day: "numeric", month: "long", year: "numeric" });
}

const dayKey = (ms: number, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));

/**
 * The start line: cohort time, plus "(… where you are)" when the learner's zone differs. Just the time when it falls
 * on the same day for the learner, the full date when it does not.
 */
export function startText(schedule: { startsAt?: string | null; cohortTimezone?: string | null; learnerTimezone?: string | null } | undefined): string {
  const startsAt = instantMs(schedule?.startsAt);
  if (startsAt === null) return "We will confirm your start date soon.";
  const cohortZone = validTimeZone(schedule?.cohortTimezone) ?? DEFAULT_COHORT_TIMEZONE;
  let text = formatInstant(schedule?.startsAt, cohortZone) ?? "";
  const learnerZone = validTimeZone(schedule?.learnerTimezone, null);
  if (learnerZone && learnerZone !== cohortZone) {
    const iso = new Date(startsAt).toISOString();
    const sameDay = dayKey(startsAt, learnerZone) === dayKey(startsAt, cohortZone);
    const local = sameDay
      ? format(iso, learnerZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" })
      : format(iso, learnerZone, { ...FULL, timeZoneName: "short" });
    text += ` (${local} where you are)`;
  }
  return text;
}

// ---- gate and home ----------------------------------------------------------------------------------------------------

export type GateKind = "confirming" | "stuck" | "not_paid" | "unavailable";

export type PortalView =
  | { readonly kind: "home"; readonly home: PortalHome }
  | { readonly kind: "gate"; readonly gate: GateKind; readonly retryAfterSeconds: number | null; readonly support: SupportView };

/** Seconds to wait before checking again: the server's hint, kept within sane bounds. */
export function retryDelaySeconds(hint: number | null | undefined): number {
  const value = typeof hint === "number" && Number.isFinite(hint) && hint > 0 ? hint : DEFAULT_RETRY_SECONDS;
  return Math.min(MAX_RETRY_SECONDS, Math.max(MIN_RETRY_SECONDS, Math.round(value)));
}

function isHome(body: PortalHomeResponse): body is PortalHome {
  return body.state === "eligible";
}

/**
 * Turns an API answer into something a page can switch on. An unknown state, or a state that should not reach the page,
 * becomes the generic "unavailable" gate rather than a crash. (`blocked` never arrives: the API answers `not_paid`.)
 */
export function interpretPortal(body: PortalHomeResponse | PortalGate): PortalView {
  if (isHome(body as PortalHomeResponse)) return { kind: "home", home: body as PortalHome };
  const gate = body as PortalGate;
  const kind: GateKind = gate.state === "confirming" || gate.state === "stuck" || gate.state === "not_paid" ? gate.state : "unavailable";
  return {
    kind: "gate",
    gate: kind,
    retryAfterSeconds: kind === "confirming" ? retryDelaySeconds(gate.retryAfterSeconds) : null,
    support: supportView(gate.support),
  };
}

// ---- checklist --------------------------------------------------------------------------------------------------------

/** Only `confirm` and `consent` tasks have a button; anything else is read-only. */
export function isActionable(task: Pick<PortalTask, "taskType">): boolean {
  return task.taskType === "confirm" || task.taskType === "consent";
}

export function requiredLeft(tasks: readonly PortalTask[]): number {
  return tasks.filter((t) => t.required === true && isActionable(t) && !t.done).length;
}

/** "2 required steps left", "All required steps are done", or null when nothing is required. */
export function checklistSummary(tasks: readonly PortalTask[]): string | null {
  if (!tasks.some((t) => t.required === true && isActionable(t))) return null;
  const left = requiredLeft(tasks);
  return left > 0 ? `${plural(left, "required step")} left` : "All required steps are done";
}

/**
 * The body to send to complete a task. A consent task sends back the hash of the wording the learner read, and cannot be
 * accepted without one. Returns null for a task that cannot be completed.
 */
export function completionInput(task: PortalTask): { itemId: number; acceptedHash?: string } | null {
  if (task.taskType === "confirm") return { itemId: task.id };
  if (task.taskType === "consent" && task.contentHash) return { itemId: task.id, acceptedHash: task.contentHash };
  return null;
}

/** Replaces the task with the same id; the list is returned unchanged when the id is unknown. */
export function replaceTask(tasks: readonly PortalTask[], next: PortalTask): PortalTask[] {
  return tasks.map((t) => (t.id === next.id ? next : t));
}

// ---- polling ----------------------------------------------------------------------------------------------------------

/** Stop checking after this many polls in a row; the page then offers a manual "Check again". */
export const MAX_POLLS = 120;

/**
 * Seconds until the next check while "confirming", or null to stop. Backs off gently (+50% every 10 polls) so a learner
 * who leaves the tab open for hours does not hammer the API, and never goes beyond `MAX_RETRY_SECONDS`.
 */
export function nextPollSeconds(hintSeconds: number | null | undefined, pollsSoFar: number): number | null {
  if (!Number.isInteger(pollsSoFar) || pollsSoFar < 0 || pollsSoFar >= MAX_POLLS) return null;
  const base = retryDelaySeconds(hintSeconds);
  return Math.min(MAX_RETRY_SECONDS, Math.round(base * (1 + Math.floor(pollsSoFar / 10) * 0.5)));
}
