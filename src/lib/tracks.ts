import { z } from "zod";
import { apiOriginFromEnv, fetchApiJson, type FetchLike } from "@/lib/api-fetch";
import { DEMO_PAYLOADS, demoDataEnabled } from "@/lib/demo-data";
import { DIFFICULTIES, type Track } from "@/lib/track-filters";

// Browser-safe helpers live in track-filters.ts; re-exported here so server code has one import.
export {
  categoriesOf,
  filterTracks,
  findTrack,
  initialsOf,
  relatedTracks,
  trackAccent,
  trackStats,
  type Track,
} from "@/lib/track-filters";

const HEX_COLOR = /^[0-9A-Fa-f]{6}$/;

const TrackSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().nullish().transform((v) => v ?? null),
  blurb: z.string().nullish().transform((v) => v ?? null),
  // The API sends bare hex ("2563EB"). Anything else is dropped, never passed into CSS.
  color: z
    .string()
    .nullish()
    .transform((v) => (v && HEX_COLOR.test(v) ? v.toUpperCase() : null)),
  sortOrder: z.number(),
  // Newer API fields. `instructor` is shown on the home cards only when present and non-blank.
  instructor: z.string().nullish().transform((v) => v?.trim() || null).catch(null),
  // Both of these are newer API fields too. Each is checked on its own and falls back to null, so an API that does not send
  // them yet, or one odd value, never drops the track or hides the others.
  difficulty: z.enum(DIFFICULTIES).nullish().transform((v) => v ?? null).catch(null),
  enrolleeCount: z.number().int().nonnegative().nullish().transform((v) => v ?? null).catch(null),
});

const TracksResponseSchema = z.object({
  ok: z.literal(true),
  cohort: z.string().nullable(),
  /** Which application flow the open cohort uses. Absent (or odd) from an API that does not report it yet: the award flow. */
  payAtApply: z.boolean().default(false).catch(false),
  tracks: z.array(TrackSchema),
});

export type TracksData = { readonly isOpen: boolean; readonly payAtApply: boolean; readonly tracks: readonly Track[] };

/** A cohort in the response means it is taking applications; null means none is. */
export function parseTracksResponse(raw: unknown): TracksData | null {
  const parsed = TracksResponseSchema.safeParse(raw);
  if (!parsed.success) return null;
  const tracks: Track[] = [...parsed.data.tracks].sort((a, b) => a.sortOrder - b.sortOrder);
  return { isOpen: parsed.data.cohort !== null, payAtApply: parsed.data.payAtApply, tracks };
}

export async function getTracks(apiOrigin: string, fetchImpl?: FetchLike): Promise<TracksData | null> {
  return parseTracksResponse(await fetchApiJson(apiOrigin, "/api/tracks", fetchImpl));
}

export async function loadTracks(): Promise<TracksData | null> {
  if (demoDataEnabled()) return parseTracksResponse(DEMO_PAYLOADS.tracks);
  const origin = apiOriginFromEnv();
  return origin ? getTracks(origin) : null;
}
