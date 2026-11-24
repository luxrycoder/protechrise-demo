"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import {
  acceptOutcome,
  canContinue,
  describeStartError,
  describeStartInfo,
  type StartFormView,
} from "@/features/claim-start/start";
import { createApi } from "@/lib/api";
import styles from "@/features/claim-start/claim-start.module.css";

const api = createApi();

type Load = { readonly kind: "loading" } | { readonly kind: "form"; readonly view: StartFormView } | { readonly kind: "closed" } | { readonly kind: "retry" };

type Props = { readonly token: string };

/**
 * Confirm the course and the policies before paying. This only records the acceptance; the applicant is then sent
 * to `/claim?token=`, which the server turns into the Paystack checkout. Access is granted by the payment webhook.
 */
export function ClaimStart({ token }: Props) {
  const [load, setLoad] = useState<Load>(token ? { kind: "loading" } : { kind: "closed" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void api.claim.startInfo(token).then((result) => {
      if (cancelled) return;
      setLoad(result.ok ? { kind: "form", view: describeStartInfo(result.data) } : describeStartError(result.error));
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  switch (load.kind) {
    case "loading":
      return (
        <div role="status">
          <div className={styles.spinner} aria-hidden="true" />
          <h1 className={styles.title}>One moment…</h1>
        </div>
      );
    case "retry":
      return (
        <div role="alert">
          <h1 className={styles.title}>We could not load this page</h1>
          <p className={styles.lead}>Check your connection and reload this page. If it keeps happening, contact admissions@protechrise.com.</p>
        </div>
      );
    case "closed":
      return <Closed />;
    case "form":
      return <StartForm token={token} view={load.view} onClosed={() => setLoad({ kind: "closed" })} />;
  }
}

function Closed() {
  return (
    <div>
      <h1 className={styles.title}>This link is not valid any more</h1>
      <p className={styles.lead}>Your payment window may have closed. Check your status page, or contact admissions@protechrise.com.</p>
      <div className={styles.actions}>
        <Link href="/status" className={styles.btn}>Go to your status page</Link>
      </div>
    </div>
  );
}

function StartForm({ token, view, onClosed }: { readonly token: string; readonly view: StartFormView; readonly onClosed: () => void }) {
  const [track, setTrack] = useState(view.selectedTrack);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const trackId = useId();

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    const outcome = acceptOutcome(await api.claim.accept({ token, accepted: true, track }));
    if (outcome.kind === "pay") {
      // A full navigation: /claim is answered by the server, which redirects to Paystack.
      window.location.assign(outcome.url);
      return;
    }
    if (outcome.kind === "closed") return onClosed();
    setMessage(outcome.message);
    setSubmitting(false);
  };

  return (
    <div>
      <h1 className={styles.title}>{view.heading}</h1>
      <p className={styles.lead}>{view.intro}</p>
      <div className={styles.card}>
        <h2>Your certificate fee</h2>
        <div className={styles.fee}>{view.feeText}</div>
      </div>
      <div className={styles.card}>
        <h2>Your course</h2>
        <label className={styles.label} htmlFor={trackId}>You can keep your previous course or choose a different one</label>
        <select id={trackId} className={styles.select} value={track} onChange={(event) => setTrack(event.target.value)}>
          {view.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <label className={styles.consent}>
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
        <span>I understand and accept the <a href="/refund-policy" target="_blank" rel="noopener noreferrer">policies</a>.</span>
      </label>
      {message ? <p className={styles.error} role="alert">{message}</p> : null}
      <button type="button" className={styles.btn} disabled={submitting || !canContinue({ accepted, track })} onClick={() => void submit()}>
        {submitting ? "Please wait…" : "Continue to payment"}
      </button>
    </div>
  );
}
