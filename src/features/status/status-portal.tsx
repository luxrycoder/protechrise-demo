"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { describeStatus, entryMessage, isSafeLocalPath, type EntryMessage, type StatusViewModel } from "@/features/status/status-view";
import { PortalLink } from "@/features/portal/portal-link-view";
import { CohortSwitcher, LmsDoor, TrackChange } from "@/features/status/status-action-panels";
import { createApi } from "@/lib/api";
import type { StatusMe } from "@/lib/api/schemas/status";
import styles from "@/features/status/status.module.css";

const api = createApi();

type Props = { readonly expired?: string; readonly next?: string; readonly lmsOrigin: string | null };
type Screen = { readonly kind: "loading" } | { readonly kind: "signIn" } | StatusViewModel;
type Eligible = Extract<StatusMe, { eligible: true }>;

/**
 * The applicant's status page. Sign-in is a passwordless email link verified by the API (`/status/verify`), which sets
 * a same-origin cookie; this page only asks for the link and then reads `/api/status/me`. No token is ever in this page's URL.
 */
export function StatusPortal({ expired, next, lmsOrigin }: Props) {
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [me, setMe] = useState<StatusMe | null>(null);
  // Bumped after an action changes something on the server, so the page shows the new state.
  const [reloads, setReloads] = useState(0);
  const safeNext = isSafeLocalPath(next) ? next : undefined;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await api.status.me();
      if (cancelled) return;
      if (!result.ok) return setScreen({ kind: "signIn" });
      if (result.data.eligible && result.data.paymentConfirmed && safeNext) {
        window.location.replace(safeNext);
        return;
      }
      setMe(result.data);
      setScreen(describeStatus(result.data));
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [safeNext, reloads]);

  const signedOut = useCallback(() => setScreen({ kind: "signIn" }), []);
  const refresh = useCallback(() => setReloads((n) => n + 1), []);
  const signOut = async () => {
    await api.status.logout();
    signedOut();
  };

  switch (screen.kind) {
    case "loading":
      return (
        <div role="status">
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.lead}>Loading your status…</p>
        </div>
      );
    case "signIn":
      return <RequestLink intro={entryMessage({ expired, next })} next={safeNext} />;
    case "notReady":
      return (
        <>
          <h1 className={styles.title}>Thanks for applying</h1>
          <div className={styles.card}>
            <div className={styles.name}>{screen.name}</div>
            <p className={styles.lead}>Your application is in the review queue. Check back for your application status on {screen.availableText}.</p>
            {me ? <CohortSwitcher me={me} onChanged={refresh} /> : null}
          </div>
        </>
      );
    case "status":
      return <Status view={screen} me={me?.eligible ? me : null} onSignOut={signOut} onChanged={refresh} onSignedOut={signedOut} lmsOrigin={lmsOrigin} />;
  }
}

function RequestLink({ intro, next }: { readonly intro: EntryMessage | null; readonly next: string | undefined }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<EntryMessage | null>(intro);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = await api.status.requestLink({ email, ...(next ? { next } : {}) });
    setBusy(false);
    if (result.ok) {
      setMessage({ text: result.data.message, isError: false });
      setEmail("");
    } else {
      setMessage({ text: result.error.message, isError: true });
    }
  };

  return (
    <>
      <h1 className={styles.title}>Check your status</h1>
      <p className={styles.lead}>Applicants and academy team — enter your email address and we&apos;ll send you a sign-in link.</p>
      <div className={styles.card}>
        <form onSubmit={submit} noValidate={false}>
          <label htmlFor="status-email" className={styles.label}>Email address</label>
          <input id="status-email" className={styles.input} type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className={styles.button} type="submit" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link"}</button>
        </form>
        <p className={message?.isError ? styles.msgError : styles.msg} role="status" aria-live="polite">{message?.text ?? ""}</p>
      </div>
    </>
  );
}

type StatusProps = {
  readonly view: Extract<StatusViewModel, { kind: "status" }>;
  readonly me: Eligible | null;
  readonly onSignOut: () => void;
  readonly onChanged: () => void;
  readonly onSignedOut: () => void;
  readonly lmsOrigin: string | null;
};

function Status({ view, me, onSignOut, onChanged, onSignedOut, lmsOrigin }: StatusProps) {
  return (
    <>
      <h1 className={styles.title}>Your application</h1>
      <div className={styles.card}>
        <div className={styles.name}>{view.name}</div>
        <div className={styles.track}>{view.track}</div>
        <span className={styles.pill} data-status={view.pill.status}>{view.pill.label}</span>

        {view.claim ? (
          <div className={styles.block}>
            <a className={styles.primary} href={view.claim.href}>{view.claim.label}</a>
            {view.claim.deadline ? <p className={styles.deadline}>{view.claim.deadline}</p> : null}
          </div>
        ) : null}

        {view.confirmed ? <p className={styles.confirmed}>Your seat is confirmed — payment received. Watch your inbox for onboarding details.</p> : null}

        {view.community ? (
          <div className={styles.block}>
            <p className={styles.lead}>
              Your invitation is sent separately. Use it to activate your community account, or sign in to your existing account. Your private pod link appears once membership is ready and verified.
            </p>
            <a className={styles.primary} href="/community">Join Course Group</a>
          </div>
        ) : null}

        {view.pod ? <p className={styles.lead} role="status">{view.pod.text}</p> : null}
        {view.pod?.openLink ? <a className={styles.primary} href="/community/pod">Open my pod</a> : null}

        {me?.paymentConfirmed ? <PortalLink /> : null}

        {me ? <CohortSwitcher me={me} onChanged={onChanged} /> : null}
        {me?.paymentConfirmed ? <LmsDoor timezone={me.timezone} lmsOrigin={lmsOrigin} onSignedOut={onSignedOut} /> : null}
        {me ? <TrackChange me={me} onChanged={onChanged} onSignedOut={onSignedOut} /> : null}

        <ul className={styles.timeline}>
          {view.timeline.map((entry) => (
            <li key={`${entry.status}-${entry.date}`}>
              <span className={styles.pill} data-status={entry.status}>{entry.label}</span>
              <span className={styles.meta}>{entry.date}</span>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button type="button" className={styles.linkButton} onClick={onSignOut}>Not you? Check a different email</button>
        </div>
      </div>
      <p className={styles.foot}><Link href="/faq">Questions? Read the FAQ</Link></p>
    </>
  );
}
