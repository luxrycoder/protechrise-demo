"use client";

import { useState } from "react";
import { CourseCardGrid } from "@/components/home/course-card-grid";
import type { Track } from "@/lib/track-filters";
import { answersQuery, matchTracks, resultsNote } from "./matcher";
import { INTEREST_QUESTION_ID, QUESTIONS, UNSURE_VALUE } from "./questions";
import type { FinderAnswer } from "./types";
import styles from "./track-finder.module.css";

/**
 * A short quiz that narrows the live track list. It only filters real tracks, never invents one: with no
 * match it shows them all.
 */
export function TrackFinder({
  tracks,
  isOpen,
  initialAnswers = [],
}: {
  readonly tracks: readonly Track[];
  /** False when no cohort is taking applications, so results do not offer to apply. */
  readonly isOpen: boolean;
  /** A full set of answers read from the URL, so a shared or refreshed link shows the same result. */
  readonly initialAnswers?: readonly FinderAnswer[];
}) {
  const [step, setStep] = useState(initialAnswers.length > 0 ? QUESTIONS.length : 0);
  const [answers, setAnswers] = useState<readonly FinderAnswer[]>(initialAnswers);

  const done = step >= QUESTIONS.length;
  const question = QUESTIONS[step];
  const current = question ? answers.find((a) => a.questionId === question.id)?.value : undefined;

  function choose(questionId: string, value: string) {
    setAnswers((prev) => [...prev.filter((a) => a.questionId !== questionId), { questionId, value }]);
  }

  function go(next: number) {
    setStep(next);
    // Keep the result in the address (answers are not personal data) so a refresh or a shared link shows it again.
    window.history.replaceState(null, "", next >= QUESTIONS.length ? `?${answersQuery(answers)}` : window.location.pathname);
    // Move focus to the new question or the results heading so keyboard and screen-reader users land on them.
    requestAnimationFrame(() => document.getElementById("finder-focus")?.focus());
  }

  if (done) {
    const { tracks: matched, narrowed } = matchTracks(answers, tracks);
    const unsure = answers.find((a) => a.questionId === INTEREST_QUESTION_ID)?.value === UNSURE_VALUE;
    return (
      <div className={styles.wrap}>
        <h2 id="finder-focus" tabIndex={-1} className={styles.resultsTitle}>
          {narrowed ? (matched.length === 1 ? "Your best match" : "Your best matches") : "Here are all our tracks"}
        </h2>
        <p className={styles.resultsNote}>
          {narrowed || unsure ? "" : "We couldn't narrow it down from your answers, so here is everything on offer. "}
          {resultsNote(answers)}
        </p>
        {isOpen ? null : (
          <p className={styles.resultsNote} role="status">
            Applications are closed right now. Please check back soon.
          </p>
        )}
        <CourseCardGrid tracks={matched} catalogue={tracks} apply={isOpen} />
        <button type="button" className={styles.restart} onClick={() => { setAnswers([]); go(0); }}>
          Start over
        </button>
      </div>
    );
  }

  if (!question) return null;

  return (
    <form
      className={styles.wrap}
      onSubmit={(event) => {
        event.preventDefault();
        if (current) go(step + 1);
      }}
    >
      <p className={styles.progress} aria-live="polite">
        Question {step + 1} of {QUESTIONS.length}
      </p>
      <div className={styles.bar} aria-hidden="true">
        <span style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend} id="finder-focus" tabIndex={-1}>
          {question.prompt}
        </legend>
        <ul className={styles.options}>
          {question.options.map((option) => {
            const id = `${question.id}-${option.value}`;
            return (
              <li key={option.value} className={styles.option}>
                <input
                  type="radio"
                  id={id}
                  name={question.id}
                  value={option.value}
                  checked={current === option.value}
                  onChange={() => choose(question.id, option.value)}
                />
                <label htmlFor={id}>{option.label}</label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      <div className={styles.actions}>
        {step > 0 ? (
          <button type="button" className={styles.back} onClick={() => go(step - 1)}>
            Back
          </button>
        ) : null}
        <button type="submit" className={`btn btn-primary ${styles.next}`} disabled={!current}>
          {step === QUESTIONS.length - 1 ? "See my matches" : "Next"}
        </button>
      </div>
    </form>
  );
}
