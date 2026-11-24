import { z } from "zod";

/**
 * The learner portal (issue #46). The API answers `GET /api/portal/home` with either the learner's home
 * (`state: "eligible"`) or a small gate body, and `GET /api/portal/state` with the gate body only.
 * The portal only exists while the API's PORTAL_ENABLED flag is on; when off every route answers 404.
 *
 * Shapes are derived by hand from the legacy handlers (waitlist-api `lib/portal-home.js`, `lib/portal-state.js`,
 * `lib/portal-items.js`) until a test account exists to record real responses. Every block of the home is optional and
 * falls back to `undefined` when it does not parse, so one malformed block hides that card instead of failing the page.
 */

/** Support route written by the owner. The link is only trusted when it passes `safeSupportUrl` (src/lib/portal.ts). */
export const PortalSupportSchema = z.looseObject({
  text: z.string().nullish(),
  url: z.string().nullish(),
});
export type PortalSupport = z.output<typeof PortalSupportSchema>;

/** A gate body: why the portal is not open yet. `state` is a plain string so a state added later cannot break the page. */
export const PortalGateSchema = z.looseObject({
  ok: z.boolean().optional(),
  state: z.string(),
  retryAfterSeconds: z.number().nullish(),
  support: PortalSupportSchema.nullish().catch(undefined),
});
export type PortalGate = z.output<typeof PortalGateSchema>;

const text = z.string().nullish();

const PortalLearnerSchema = z.looseObject({
  firstName: text,
  track: text,
  cohortName: text,
  studentId: text,
});

const PortalScheduleSchema = z.looseObject({
  startsAt: text,
  lmsOpensAt: text,
  cohortTimezone: text,
  learnerTimezone: text,
});

const PortalPodSchema = z.looseObject({ name: text, state: text });

const PortalReceiptSchema = z.looseObject({
  studentId: text,
  amountText: text,
  paidAt: text,
  /** Only the last 6 characters ever leave the server. */
  reference: text,
});

const PortalCommunitySchema = z.looseObject({ state: z.string().optional(), url: text });

/** The classroom (LMS) door: a state only, never a URL or ticket. Those come from `status.lmsHandoff`, on a click. */
export const PortalLmsSchema = z.looseObject({
  state: z.string().optional(),
  opensAt: text,
});
export type PortalLms = z.output<typeof PortalLmsSchema>;

/** A checklist task. `taskType`: `confirm` ("I've done this"), `consent` (exact wording + hash), anything else is read-only. */
export const PortalTaskSchema = z.looseObject({
  id: z.number().int(),
  title: z.string(),
  body: text,
  linkUrl: text,
  taskType: z.string().nullish(),
  required: z.boolean().optional(),
  done: z.boolean().optional(),
  /** Hash of the wording shown; sent back with a consent acceptance so a changed wording is refused. */
  contentHash: z.string().nullish(),
});
export type PortalTask = z.output<typeof PortalTaskSchema>;

export const PortalAnnouncementSchema = z.looseObject({
  id: z.number().int(),
  title: z.string(),
  body: text,
  publishedAt: text,
});
export type PortalAnnouncement = z.output<typeof PortalAnnouncementSchema>;

export const PortalEventSchema = z.looseObject({
  id: z.number().int(),
  title: z.string(),
  body: text,
  startsAt: z.string(),
  linkUrl: text,
});
export type PortalEvent = z.output<typeof PortalEventSchema>;

/** Drops list entries that do not parse instead of failing the whole list. */
const lenientList = <T extends z.ZodType>(item: T) =>
  z
    .array(z.unknown())
    .transform((entries) => entries.flatMap((entry) => { const parsed = item.safeParse(entry); return parsed.success ? [parsed.data as z.output<T>] : []; }));

const PortalItemsSchema = z.looseObject({
  tasks: lenientList(PortalTaskSchema).catch([]),
  announcements: lenientList(PortalAnnouncementSchema).catch([]),
  events: lenientList(PortalEventSchema).catch([]),
});

/** The learner's home. Only sent when `state` is `eligible`. */
export const PortalHomeSchema = z.looseObject({
  ok: z.boolean().optional(),
  state: z.literal("eligible"),
  learner: PortalLearnerSchema.optional().catch(undefined),
  schedule: PortalScheduleSchema.optional().catch(undefined),
  pod: PortalPodSchema.optional().catch(undefined),
  receipt: PortalReceiptSchema.optional().catch(undefined),
  community: PortalCommunitySchema.optional().catch(undefined),
  items: PortalItemsSchema.optional().catch(undefined),
  lms: PortalLmsSchema.optional().catch(undefined),
  support: PortalSupportSchema.nullish().catch(undefined),
});
export type PortalHome = z.output<typeof PortalHomeSchema>;

/**
 * What `GET /api/portal/home` returns: the home (`state: "eligible"`), or a gate body. Use `interpretPortal`
 * (src/lib/portal.ts) to turn it into something a page can switch on.
 */
export const PortalHomeResponseSchema = z.union([PortalHomeSchema, PortalGateSchema]);
export type PortalHomeResponse = z.output<typeof PortalHomeResponseSchema>;

export const PortalCompleteInputSchema = z.object({
  itemId: z.number().int().min(1),
  /** Hash of the wording the learner read; the server rejects the acceptance if the wording changed. */
  acceptedHash: z.string().optional(),
});

/**
 * `{ ok: true, task }` on success, or a gate body when the learner is not eligible. A 409 (wording changed) is an
 * error whose body carries the fresh `task`; read it with `PortalTaskSchema` from `error.body`.
 */
export const PortalCompleteResponseSchema = z.looseObject({
  ok: z.boolean().optional(),
  state: z.string().optional(),
  task: PortalTaskSchema.optional().catch(undefined),
});
export type PortalCompleteResponse = z.output<typeof PortalCompleteResponseSchema>;
