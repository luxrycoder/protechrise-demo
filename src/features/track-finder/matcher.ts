import type { Track } from "@/lib/track-filters";
import { EVENINGS_QUESTION_ID, INTEREST_QUESTION_ID, QUESTIONS } from "./questions";
import type { FinderAnswer } from "./types";

/**
 * Which tracks each interest answer points to, by slug. Slugs are stable identifiers; names and categories come
 * from the live API and can change, so matching on their words gave wrong results (Product Design under
 * "products", AI Prompt Engineering under "code", Virtual Assistant unreachable). A slug the live list no longer
 * has is ignored. Keep every live track reachable from at least one interest (the tests check this).
 */
export const INTEREST_TRACKS: Readonly<Record<string, readonly string[]>> = {
  products: ["product", "project"],
  code: ["frontend", "backend", "cloud", "mobile"],
  data: ["data"],
  ai: ["ai-prompt", "ai-auto"],
  design: ["design"],
  security: ["cyber"],
  marketing: ["marketing"],
  admin: ["project", "virtual"],
};

export type FinderResult = {
  readonly tracks: readonly Track[];
  /** False when nothing matched, so `tracks` is the whole live list rather than a recommendation. */
  readonly narrowed: boolean;
};

/**
 * Narrows the live track list by the interest answer. It never invents a recommendation: the result is always a
 * subset of `tracks`, and when nothing matches (or the answer is missing or unknown) it is the whole list.
 */
export function matchTracks(answers: readonly FinderAnswer[], tracks: readonly Track[]): FinderResult {
  const interest = answers.find((a) => a.questionId === INTEREST_QUESTION_ID)?.value;
  const wanted = interest ? INTEREST_TRACKS[interest] : undefined;
  if (!wanted) return { tracks, narrowed: false };

  const matched = tracks.filter((track) => wanted.includes(track.slug));
  return matched.length > 0 ? { tracks: matched, narrowed: true } : { tracks, narrowed: false };
}

/** A short, honest note for the results screen, built only from facts the site already states (home and FAQ). */
export function resultsNote(answers: readonly FinderAnswer[]): string {
  const value = (id: string) => answers.find((a) => a.questionId === id)?.value;
  const parts = ["Every track runs 3 months, live in the evenings (6PM/7:30PM WAT)."];
  if (value("experience") === "none" || value("experience") === "some") {
    parts.unshift(
      "No experience needed: every track starts from the fundamentals. You need basic computer literacy, a device and internet access.",
    );
  }
  if (value(EVENINGS_QUESTION_ID) === "no") parts.push("Sessions are recorded too.");
  return parts.join(" ");
}

/**
 * Reads answers back from URL parameters (one per question id). Returns them only when every question has a
 * valid option, so a shared or edited link can never show a half-answered or made-up result.
 */
export function parseAnswers(params: Readonly<Record<string, string | readonly string[] | undefined>>): readonly FinderAnswer[] {
  const answers: FinderAnswer[] = [];
  for (const question of QUESTIONS) {
    const raw = params[question.id];
    const value = typeof raw === "string" ? raw : undefined;
    if (!value || !question.options.some((o) => o.value === value)) return [];
    answers.push({ questionId: question.id, value });
  }
  return answers;
}

/** The query string that carries a full set of answers. */
export function answersQuery(answers: readonly FinderAnswer[]): string {
  return new URLSearchParams(answers.map((a) => [a.questionId, a.value])).toString();
}
