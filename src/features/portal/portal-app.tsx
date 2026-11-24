"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PortalHomeView } from "@/features/portal/portal-home";
import { SIGN_IN_COPY, SIGN_IN_HREF, gateCopy, screenFromResult, type PortalScreen } from "@/features/portal/portal-screen";
import { createApi } from "@/lib/api";
import { nextPollSeconds, type SupportView } from "@/lib/portal";
import styles from "@/features/portal/portal.module.css";

const api = createApi();

/**
 * The learner portal. Reads `GET /api/portal/home` and shows the gate (confirming, stuck, not paid), the sign-in prompt,
 * a plain "not available" page while the portal is switched off, or the learner's home. While "confirming" it checks
 * again by itself: gently backing off, pausing while the tab is hidden, and giving up after a while with a manual button.
 */
type Props = { readonly lmsOrigin: string | null };

export function PortalApp({ lmsOrigin }: Props) {
  const [screen, setScreen] = useState<PortalScreen>({ kind: "loading" });
  const [gaveUp, setGaveUp] = useState(false);
  // Bumped each time a home arrives, so the home (and its checklist) starts fresh from the new answer.
  const [homeVersion, setHomeVersion] = useState(0);
  const polls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const loading = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    clearTimer();
    const next = screenFromResult(await api.portal.home());
    loading.current = false;
    if (!alive.current) return;
    setScreen(next);
    if (next.kind === "home") setHomeVersion((n) => n + 1);
    if (next.kind !== "gate" || next.gate !== "confirming") {
      polls.current = 0;
      setGaveUp(false);
      return;
    }
    const wait = nextPollSeconds(next.retryAfterSeconds, polls.current);
    if (wait === null) return setGaveUp(true);
    polls.current += 1;
    setGaveUp(false);
    // A hidden tab does not poll; it checks once when the learner comes back (see the visibility listener).
    if (document.visibilityState === "visible") timer.current = setTimeout(() => void loadRef.current(), wait * 1000);
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    alive.current = true;
    // Deferred one tick so the effect itself does not set state synchronously.
    timer.current = setTimeout(() => void loadRef.current(), 0);
    const onVisible = () => {
      if (document.visibilityState === "visible" && alive.current) {
        setScreen((current) => {
          if (current.kind === "gate" && current.gate === "confirming") void load();
          return current;
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive.current = false;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // When the screen changes (for example from "confirming" to the home) move focus to its heading for screen readers.
  const kind = screen.kind === "gate" ? `gate-${screen.gate}` : screen.kind;
  useEffect(() => {
    if (kind !== "loading") heading.current?.focus();
  }, [kind]);

  const endSession = useCallback(() => {
    clearTimer();
    polls.current = 0;
    setScreen({ kind: "signIn" });
  }, []);

  const signOut = async () => {
    await api.status.logout();
    // Even if the call failed the learner asked to leave: show the sign-in prompt. The server session may remain
    // until it expires, which is the same as the status page's behaviour.
    endSession();
  };

  const reload = () => {
    polls.current = 0;
    void load();
  };

  const checkAgain = () => {
    polls.current = 0;
    setGaveUp(false);
    setScreen({ kind: "loading" });
    void load();
  };

  switch (screen.kind) {
    case "loading":
      return (
        <div className={`${styles.card} ${styles.center}`} role="status" aria-live="polite">
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.lead}>Checking your access…</p>
        </div>
      );
    case "signIn":
      return (
        <Card center headingRef={heading} title={SIGN_IN_COPY.title}>
          <p className={styles.lead}>{SIGN_IN_COPY.body}</p>
          <Link className={styles.primary} href={SIGN_IN_HREF}>{SIGN_IN_COPY.actionLabel}</Link>
        </Card>
      );
    case "off":
      // Same words as the site's own 404, so a switched-off portal is not announced.
      return (
        <Card center headingRef={heading} title="Page not found">
          <p className={styles.lead}>We could not find the page you were looking for.</p>
          <Link className={styles.primary} href="/">Back to the homepage</Link>
        </Card>
      );
    case "error":
      return (
        <Card center headingRef={heading} title="We could not load your portal">
          <p className={`${styles.lead} ${styles.error}`} role="alert">{screen.message}</p>
          {screen.retryable ? <button type="button" className={styles.primary} onClick={checkAgain}>Try again</button> : null}
        </Card>
      );
    case "gate": {
      const copy = gateCopy(screen.gate);
      return (
        <Card center headingRef={heading} title={copy.title} waiting={copy.waiting && !gaveUp}>
          <p className={styles.lead}>{gaveUp ? "We have stopped checking automatically. Check again when you are ready." : copy.body}</p>
          {copy.action ? <Link className={styles.primary} href={copy.action.href}>{copy.action.label}</Link> : null}
          {gaveUp ? <button type="button" className={styles.primary} onClick={checkAgain}>Check again</button> : null}
          {copy.showSupport ? <Support support={screen.support} /> : null}
        </Card>
      );
    }
    case "home":
      return <PortalHomeView key={homeVersion} home={screen.home} headingRef={heading} onSignOut={signOut} onSessionEnded={endSession} onReload={reload} lmsOrigin={lmsOrigin} />;
  }
}

type CardProps = {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly center?: boolean;
  readonly waiting?: boolean;
};

function Card({ title, children, headingRef, center, waiting }: CardProps) {
  return (
    <div className={`${styles.card} ${center ? styles.center : ""}`} aria-live="polite" aria-busy={waiting ? "true" : "false"}>
      {waiting ? <div className={styles.spinner} aria-hidden="true" /> : null}
      <h1 className={styles.title} ref={headingRef} tabIndex={-1}>{title}</h1>
      {children}
    </div>
  );
}

function Support({ support }: { readonly support: SupportView }) {
  return (
    <p className={styles.note}>
      {support.text}{" "}
      {support.url ? <a href={support.url} rel="noopener noreferrer">Contact support</a> : null}
    </p>
  );
}
