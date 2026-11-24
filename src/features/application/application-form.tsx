"use client";

import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { emptyValues, stepsFor, type CheckboxFieldId, type FieldId, type FlowId, type TextFieldId } from "@/features/application/fields";
import { destinationAfterSubmit } from "@/features/application/after-submit";
import { APPLY_PAY } from "@/content/apply-pay";
import { PriceBlock } from "@/features/application/price-block";
import { emailCheckOutcome } from "@/features/application/email-check";
import { firstBlockedStep, formReducer, initialState } from "@/features/application/form-state";
import { StepProgress } from "@/features/application/step-progress";
import { StepAbout } from "@/features/application/steps/step-about";
import { StepPay } from "@/features/application/steps/step-pay";
import { StepBackground } from "@/features/application/steps/step-background";
import { StepScholarship } from "@/features/application/steps/step-scholarship";
import type { StepProps } from "@/features/application/steps/step-types";
import { describeSubmitError } from "@/features/application/submit-errors";
import { checkEmailAddress, submitApplication, type EmailChecker, type SubmitHandler, type SubmitRequest } from "@/features/application/submit";
import { buildApplicationInput, buildShortApplicationInput, validateField } from "@/features/application/validation";
import { NO_TERMS, type PublicTerms } from "@/lib/fee";
import type { Track } from "@/lib/track-filters";
import styles from "./application.module.css";

type Props = {
  readonly tracks: readonly Track[];
  /** The live fee, tuition and scholarship percent; each is null when unavailable. */
  readonly terms?: PublicTerms;
  /** Which application the open cohort takes. Defaults to the three-step award application. */
  readonly flow?: FlowId;
  /** The track name to start the preferred-track field on, for a link from the quiz or a track page. */
  readonly initialTrack?: string;
  /** Overridable for tests; defaults to the typed API client. */
  readonly submit?: SubmitHandler;
  readonly checkEmail?: EmailChecker;
  /** Where to go after a successful submission. Defaults to a full page navigation. */
  readonly navigate?: (url: string) => void;
};

type Status =
  | { readonly kind: "idle" | "submitting" | "waiting" | "done" }
  | { readonly kind: "error"; readonly message: string; readonly contactEmail?: string };

const goTo = (url: string) => window.location.assign(url);

function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

const BUTTON_TEXT = { idle: "Submit Application", submitting: "Submitting...", waiting: "Still saving, please keep this page open...", done: "Submit Application", error: "Submit Application" } as const;

function payButtonText(kind: Status["kind"], fee: string | null): string {
  if (kind === "submitting") return "Saving, then taking you to payment...";
  if (kind === "waiting") return "Still saving, please keep this page open...";
  return fee ? `Pay ${fee} now` : "Pay now";
}

/**
 * The three-step scholarship application. All state lives in a pure reducer (form-state.ts); this component
 * wires it to the page: step navigation, focus management for keyboard and screen-reader users, and submission.
 */
export function ApplicationForm({ tracks, terms = NO_TERMS, flow = "award", initialTrack = "", submit = submitApplication, checkEmail = checkEmailAddress, navigate = goTo }: Props) {
  const [state, dispatch] = useReducer(formReducer, undefined, () => initialState({ ...emptyValues(), preferredTrack: initialTrack }, flow));
  const totalSteps = stepsFor(flow).length;
  const isPay = flow === "payAtApply";
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const headings = useRef<Record<number, HTMLHeadingElement | null>>({});
  const mounted = useRef(false);
  // Set synchronously on submit so a fast double click cannot start two submissions before state updates.
  const inFlight = useRef(false);

  // Move focus to the new step's heading, but not on first render.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headings.current[state.step]?.focus();
  }, [state.step]);

  // After a failed Next/Submit, focus the first field that needs attention.
  useEffect(() => {
    if (state.focusField) document.getElementById(state.focusField)?.focus();
  }, [state.focusField, state.summary]);

  const stepProps: StepProps = {
    values: state.values,
    errors: state.errors,
    onChange: (field: TextFieldId, value: string) => dispatch({ type: "change", field, value }),
    onToggle: (field: CheckboxFieldId, checked: boolean) => dispatch({ type: "toggle", field, checked }),
    onBlur: handleBlur,
  };

  const busy = status.kind === "submitting" || status.kind === "waiting";

  /**
   * Validate the field, and for the email also ask the API whether it can receive mail and is not already
   * registered, so a duplicate shows up on step 1 and not at the very end. Best effort: the server checks again.
   */
  function handleBlur(field: FieldId) {
    dispatch({ type: "blur", field });
    if (field !== "email") return;
    const email = state.values.email.trim();
    if (!email || validateField("email", state.values) !== "") return;
    if (state.emailCheck.email === email && state.emailCheck.status !== "idle") return;
    dispatch({ type: "emailCheckStarted", email });
    void checkEmail(email).then((result) => dispatch({ type: "emailCheckResolved", email, outcome: emailCheckOutcome(result) }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Enter inside an earlier step means "Next", never a submission.
    if (state.step < totalSteps) {
      dispatch({ type: "next" });
      return;
    }
    if (inFlight.current || busy || tracks.length === 0) return;
    if (firstBlockedStep(state) !== null) {
      dispatch({ type: "submitAttempt" });
      return;
    }
    inFlight.current = true;
    setStatus({ kind: "submitting" });
    let eventIds = { tiktok: null as string | null, meta: null as string | null };
    const timezone = browserTimezone();
    const request: SubmitRequest = isPay
      ? { flow: "payAtApply", input: buildShortApplicationInput(state.values, { timezone }) }
      : { flow: "award", input: buildApplicationInput(state.values, { timezone }) };
    const result = await submit(request, {
      onWait: () => setStatus({ kind: "waiting" }),
      onResponse: (response) => {
        eventIds = { tiktok: response.headers.get("X-TikTok-Event-Id"), meta: response.headers.get("X-Meta-Event-Id") };
      },
    });
    if (!result.ok) {
      inFlight.current = false;
      setStatus({ kind: "error", ...describeSubmitError(result.error) });
      return;
    }
    // Stay "done" (and locked) while the browser navigates, so the form cannot be submitted twice.
    setStatus({ kind: "done" });
    navigate(destinationAfterSubmit(result.data, { track: request.input.preferredTrack, tiktokEventId: eventIds.tiktok, metaEventId: eventIds.meta }));
  }

  if (status.kind === "done") {
    return (
      <div className={`${styles.shell} ${styles.success}`} role="status">
        <h2 className={styles.stepHeading}>Application received</h2>
        <p>{isPay ? "Thank you. Taking you to payment..." : "Thank you. We have your application and will email you about the next steps."}</p>
      </div>
    );
  }

  const submitError = status.kind === "error" ? status : null;

  const honeypot = (
    // Real applicants never see or fill this. The server accepts a filled one silently.
    <div className={styles.honeypot} aria-hidden="true">
      <label htmlFor="website">Website</label>
      <input id="website" type="text" tabIndex={-1} autoComplete="off" value={state.values.website} onChange={(event) => dispatch({ type: "change", field: "website", value: event.target.value })} />
    </div>
  );

  const banner = state.summary ? (
    <div className={styles.summary} role="alert">
      {state.summary}
    </div>
  ) : submitError ? (
    <div className={styles.summary} role="alert">
      {submitError.message}
      {submitError.contactEmail ? (
        <>
          {" "}
          <a href={`mailto:${submitError.contactEmail}`}>{submitError.contactEmail}</a>.
        </>
      ) : null}
    </div>
  ) : null;

  if (isPay) {
    return (
      <form className={styles.shell} onSubmit={handleSubmit} noValidate aria-label="Application and payment">
        <PriceBlock terms={terms} note={APPLY_PAY.priceTopNote} />
        {honeypot}
        {banner}
        <StepPay {...stepProps} tracks={tracks} terms={terms} />
        <PriceBlock terms={terms} note={APPLY_PAY.priceBottomNote}>
          <button type="submit" className={`btn btn-primary ${styles.payButton}`} disabled={busy || tracks.length === 0}>
            {payButtonText(status.kind, terms.fee)}
          </button>
        </PriceBlock>
      </form>
    );
  }

  return (
    <form className={styles.shell} onSubmit={handleSubmit} noValidate aria-label="Scholarship application">
      <StepProgress step={state.step} maxStep={state.maxStep} onGoto={(step) => dispatch({ type: "goto", step })} />
      {honeypot}
      {banner}

      <h2 className={styles.stepHeading} tabIndex={-1} ref={(node) => void (headings.current[state.step] = node)}>
        {state.step === 1 ? "About you" : state.step === 2 ? "Background, Commitment & Goals" : "Scholarship Context & Consent"}
      </h2>

      {state.step === 1 ? <StepAbout {...stepProps} /> : null}
      {state.step === 2 ? <StepBackground {...stepProps} tracks={tracks} /> : null}
      {state.step === 3 ? <StepScholarship {...stepProps} fee={terms.fee} /> : null}

      <div className={styles.actions}>
        {state.step > 1 ? (
          <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: "back" })} disabled={busy}>
            ← Back
          </button>
        ) : (
          <span />
        )}
        {/* The keys matter: without them React reuses one <button> node and flips its type from "button" to
            "submit" while the Next click is still being handled, so the browser then submits the form. */}
        {state.step < totalSteps ? (
          <button key="next" type="button" className="btn btn-primary" onClick={() => dispatch({ type: "next" })}>
            Next →
          </button>
        ) : (
          <button key="submit" type="submit" className="btn btn-primary" disabled={busy || tracks.length === 0}>
            {BUTTON_TEXT[status.kind]}
          </button>
        )}
      </div>
    </form>
  );
}
