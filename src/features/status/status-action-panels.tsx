"use client";

import { useEffect, useId, useState } from "react";
import {
  describeLms,
  describeSwitcher,
  describeTrackChange,
  handoffOutcome,
  trackChangeConfirmText,
  trackChangeOutcome,
  type LmsData,
  type TrackChangeView,
} from "@/features/status/status-actions";
import { createApi } from "@/lib/api";
import type { StatusMe } from "@/lib/api/schemas/status";
import styles from "@/features/status/status.module.css";

const api = createApi();

type FullStatus = Extract<StatusMe, { eligible: true }>;

type ActionProps = {
  /** Reload the status after something changed on the server. */
  readonly onChanged: () => void;
  /** The session is gone: go back to the sign-in form. */
  readonly onSignedOut: () => void;
};

/** Move between this person's applications (one per cohort). The API checks the target belongs to the same email. */
export function CohortSwitcher({ me, onChanged }: { readonly me: Pick<StatusMe, "currentApplicationId" | "applications">; readonly onChanged: () => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const view = describeSwitcher(me);
  if (!view) return null;

  const change = async (value: string) => {
    setBusy(true);
    // Whatever the answer, reloading shows the application that is actually signed in.
    await api.status.switchApplication({ applicationId: Number(value) });
    setBusy(false);
    onChanged();
  };

  return (
    <div className={styles.block}>
      <label className={styles.label} htmlFor={id}>Application</label>
      <select id={id} className={styles.input} value={view.selected} disabled={busy} onChange={(event) => void change(event.target.value)}>
        {view.options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Ask to change course once; an admin decides. Shows the request's state afterwards. */
export function TrackChange({ me, onChanged, onSignedOut }: { readonly me: FullStatus } & ActionProps) {
  const view = describeTrackChange(me);
  if (!view) return null;
  return (
    <div className={styles.block}>
      {view.kind === "form" ? (
        <TrackChangeForm view={view} current={me.preferredTrack} onChanged={onChanged} onSignedOut={onSignedOut} />
      ) : (
        <p className={view.kind === "request" && view.tone === "rejected" ? styles.msgError : styles.msg}>{view.text}</p>
      )}
    </div>
  );
}

function TrackChangeForm({ view, current, onChanged, onSignedOut }: { readonly view: Extract<TrackChangeView, { kind: "form" }>; readonly current: string } & ActionProps) {
  const id = useId();
  const [target, setTarget] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const send = async () => {
    setBusy(true);
    const outcome = trackChangeOutcome(await api.status.requestTrackChange({ requestedTrack: target }));
    setBusy(false);
    if (outcome.kind === "signedOut") return onSignedOut();
    if (outcome.kind === "sent" || outcome.kind === "closed") return onChanged();
    setMessage(outcome.text);
    setConfirming(false);
  };

  return (
    <div>
      <h2 className={styles.name}>Want to switch course?</h2>
      {view.reissueNote ? <p className={styles.msg}>{view.reissueNote}</p> : null}
      <p className={styles.msg}>{view.note}</p>
      <label className={styles.label} htmlFor={id}>Choose a new course</label>
      <select
        id={id}
        className={styles.input}
        value={target}
        disabled={busy}
        onChange={(event) => {
          setTarget(event.target.value);
          setConfirming(false);
          setMessage("");
        }}
      >
        <option value="">Choose a course</option>
        {view.options.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      {confirming ? (
        <div role="alert">
          <p className={styles.msg}>{trackChangeConfirmText(current, target)}</p>
          <button type="button" className={styles.button} disabled={busy} onClick={() => void send()}>{busy ? "Sending…" : "Yes, request this change"}</button>
          <button type="button" className={styles.linkButton} disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
        </div>
      ) : (
        <button type="button" className={styles.button} disabled={!target} onClick={() => setConfirming(true)}>Request course change</button>
      )}
      <p className={styles.msgError} role="status" aria-live="polite">{message}</p>
    </div>
  );
}

/** The door to the learning platform. The address only ever comes from the hand-off request, to the person who clicks. */
export function LmsDoor({ timezone, lmsOrigin, onSignedOut }: { readonly timezone: string | null; readonly lmsOrigin: string | null } & Pick<ActionProps, "onSignedOut">) {
  const [data, setData] = useState<LmsData | "loading">("loading");
  const [opening, setOpening] = useState(false);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void api.status.lms().then((result) => {
      if (cancelled) return;
      if (!result.ok && result.error.kind === "unauthorized") return onSignedOut();
      setData(result.ok ? result.data : { state: "unavailable" });
    });
    return () => {
      cancelled = true;
    };
  }, [reloads, onSignedOut]);

  if (data === "loading") return <p className={styles.msg} role="status">Checking your LMS access…</p>;
  const view = describeLms(data, timezone);
  if (view.hidden) return null;

  const press = async () => {
    if (!view.ready) {
      setData("loading");
      setReloads((n) => n + 1);
      return;
    }
    setOpening(true);
    const outcome = handoffOutcome(await api.status.lmsHandoff(), lmsOrigin);
    if (outcome.kind === "open") {
      window.location.assign(outcome.url);
      return;
    }
    setOpening(false);
    if (outcome.kind === "signedOut") return onSignedOut();
    setData(outcome.data);
  };

  return (
    <div className={styles.block}>
      <p className={styles.msg} role="status" aria-live="polite">{opening ? "Opening your LMS access…" : view.message}</p>
      {view.stage ? <p className={styles.msg} role="status">{view.stage}</p> : null}
      {view.button ? (
        <button type="button" className={styles.button} disabled={opening} aria-busy={opening} onClick={() => void press()}>{view.button}</button>
      ) : null}
    </div>
  );
}
