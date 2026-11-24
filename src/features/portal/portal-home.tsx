"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buildHomeView, type DetailRow } from "@/features/portal/home-view";
import { TASK_CHANGED_NOTICE, TASK_FAILED_NOTICE, announcementsView, checklistView, completeOutcome, eventsView, type TaskView } from "@/features/portal/items-view";
import { LMS_FAILED, LMS_READY_NOTE, lmsCardView, lmsOpenOutcome, type LmsCardView } from "@/features/portal/lms-card";
import { createApi } from "@/lib/api";
import type { PortalTask } from "@/lib/api/schemas/portal";
import { completionInput, replaceTask, type SupportView } from "@/lib/portal";
import type { PortalHome } from "@/lib/api/schemas/portal";
import styles from "@/features/portal/portal.module.css";

const api = createApi();

const COUNTDOWN_EVERY_MS = 30_000;

/** The current time, refreshed every 30 seconds while the tab is visible. Client only: the home renders after the fetch. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(() => {
      if (document.visibilityState === "visible") tick();
    }, COUNTDOWN_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return now;
}

type Props = {
  readonly home: PortalHome;
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly onSignOut: () => Promise<void>;
  /** The session ended (401) while the learner was on the page: show the sign-in prompt. */
  readonly onSessionEnded: () => void;
  /** Load the home again (the learner is no longer eligible, or an item is gone). */
  readonly onReload: () => void;
  /** The only origin an LMS hand-off address may point to; null means the hand-off is not offered. */
  readonly lmsOrigin: string | null;
};

export function PortalHomeView({ home, headingRef, onSignOut, onSessionEnded, onReload, lmsOrigin }: Props) {
  const view = buildHomeView(home);
  const zone = home.schedule?.cohortTimezone;
  const lms = lmsCardView(home.lms, zone, lmsOrigin);
  const announcements = announcementsView(home.items?.announcements ?? [], zone);
  const events = eventsView(home.items?.events ?? [], zone);
  const now = useNow();
  const [signingOut, setSigningOut] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    await onSignOut();
    if (mounted.current) setSigningOut(false);
  };

  return (
    <div className={styles.stack}>
      <section className={`${styles.card} ${styles.hero} ${styles.noPrint}`} aria-labelledby="portal-welcome">
        {view.eyebrow ? <p className={styles.eyebrow}>{view.eyebrow}</p> : null}
        <h1 id="portal-welcome" className={styles.title} ref={headingRef} tabIndex={-1}>{view.welcome}</h1>
        <p className={styles.lead}>Classes start in</p>
        <p className={styles.countdown} aria-live="off">{view.countdown(now)}</p>
        <p className={styles.lead}>{view.startLine}</p>
      </section>

      {view.details ? (
        <section className={`${styles.card} ${styles.noPrint}`} aria-labelledby="portal-details">
          <h2 id="portal-details" className={styles.h2}>Your details</h2>
          <Rows rows={view.details} />
        </section>
      ) : null}

      {lms ? <LmsCard lms={lms} support={view.support} lmsOrigin={lmsOrigin} onSessionEnded={onSessionEnded} /> : null}

      {home.items && checklistView(home.items.tasks) ? (
        <Checklist initial={home.items.tasks} onSessionEnded={onSessionEnded} onReload={onReload} />
      ) : null}

      {view.community ? (
        <section className={`${styles.card} ${styles.noPrint}`} aria-labelledby="portal-community">
          <h2 id="portal-community" className={styles.h2}>Your community</h2>
          <p className={styles.lead}>The Official Course Group is where your cohort, tutors and announcements live.</p>
          {view.community.state === "ready" ? (
            <a className={styles.primary} href={view.community.href}>Join the Official Course Group</a>
          ) : (
            <p className={styles.note} role="status">{view.community.message}</p>
          )}
        </section>
      ) : null}

      {announcements ? (
        <section className={`${styles.card} ${styles.noPrint}`} aria-labelledby="portal-announcements">
          <h2 id="portal-announcements" className={styles.h2}>Announcements</h2>
          <ul className={styles.items}>
            {announcements.map((a) => (
              <li key={a.id} className={styles.item}>
                <h3 className={styles.h3}>{a.title}</h3>
                {a.day ? <p className={styles.when}>{a.day}</p> : null}
                {a.body ? <p className={styles.itemBody}>{a.body}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {events ? (
        <section className={`${styles.card} ${styles.noPrint}`} aria-labelledby="portal-events">
          <h2 id="portal-events" className={styles.h2}>Upcoming sessions</h2>
          <ul className={styles.items}>
            {events.map((e) => (
              <li key={e.id} className={styles.item}>
                <h3 className={styles.h3}>{e.title}</h3>
                <p className={styles.when}>{e.when}</p>
                {e.body ? <p className={styles.itemBody}>{e.body}</p> : null}
                {e.link ? <a className={styles.secondary} href={e.link} target="_blank" rel="noopener noreferrer">Join</a> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view.receipt ? (
        <section className={styles.card} aria-labelledby="portal-receipt" data-portal-receipt>
          <h2 id="portal-receipt" className={styles.h2}>Your receipt</h2>
          <Rows rows={view.receipt.rows} />
          <details className={styles.details}>
            <summary>Payment reference (last 6 characters)</summary>
            <p className={styles.mono}>{view.receipt.reference}</p>
          </details>
          <button type="button" className={`${styles.secondary} ${styles.noPrint}`} onClick={() => window.print()}>Print or save as PDF</button>
        </section>
      ) : null}

      <section className={`${styles.card} ${styles.noPrint}`} aria-labelledby="portal-help">
        <h2 id="portal-help" className={styles.h2}>Need help?</h2>
        <p className={styles.lead}>
          {view.support.text}{" "}
          {view.support.url ? <a href={view.support.url} rel="noopener noreferrer">Contact support</a> : null}
        </p>
        <p className={styles.note}>
          <Link href="/faq" className={styles.standalone}>Read the FAQ</Link>
        </p>
      </section>

      <p className={`${styles.center} ${styles.noPrint}`}>
        <button type="button" className={styles.linkButton} onClick={signOut} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button>
      </p>
    </div>
  );
}

function Rows({ rows }: { readonly rows: readonly DetailRow[] }) {
  return (
    <dl className={styles.rows}>
      {rows.map((r) => (
        <div key={r.label} className={styles.row}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

type LmsCardProps = {
  readonly lms: LmsCardView;
  readonly support: SupportView;
  readonly lmsOrigin: string | null;
  readonly onSessionEnded: () => void;
};

/**
 * The classroom door. The one-time address is requested only when the learner presses the button, held in a local
 * variable and handed straight to the browser: it is never stored, logged or rendered (it carries a secret).
 */
function LmsCard({ lms, support, lmsOrigin, onSessionEnded }: LmsCardProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  // Coming back with the browser's back button restores this page from memory with the button still disabled.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        inFlight.current = false;
        setBusy(false);
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const open = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailed(false);
    const outcome = lmsOpenOutcome(await api.status.lmsHandoff(), lmsOrigin);
    if (outcome.kind === "open") {
      // Stay disabled: the browser is leaving.
      window.location.assign(outcome.url);
      return;
    }
    inFlight.current = false;
    setBusy(false);
    if (outcome.kind === "signedOut") return onSessionEnded();
    setFailed(true);
  };

  const unavailable = lms.state === "unavailable" || failed;
  return (
    <section className={`${styles.card} ${styles.noPrint}`} aria-labelledby="portal-lms">
      <h2 id="portal-lms" className={styles.h2}>Your classroom (the LMS)</h2>
      <p className={styles.lead} aria-live="polite">{failed ? LMS_FAILED : lms.message}</p>
      {lms.opens ? <p className={styles.note}>{lms.opens}</p> : null}
      {lms.button ? (
        <>
          <button type="button" className={styles.primary} disabled={busy} aria-busy={busy} onClick={() => void open()}>{busy ? "Opening…" : "Open the LMS"}</button>
          <p className={styles.note}>{LMS_READY_NOTE}</p>
        </>
      ) : null}
      {unavailable ? (
        <p className={styles.note}>
          {support.text}{" "}
          {support.url ? <a href={support.url} rel="noopener noreferrer">Contact support</a> : null}
        </p>
      ) : null}
    </section>
  );
}

type ChecklistProps = {
  readonly initial: readonly PortalTask[];
  readonly onSessionEnded: () => void;
  readonly onReload: () => void;
};

/** The checklist. Confirm tasks are marked done; consent tasks send back the hash of the exact wording shown. */
function Checklist({ initial, onSessionEnded, onReload }: ChecklistProps) {
  const [tasks, setTasks] = useState<readonly PortalTask[]>(initial);
  const [pending, setPending] = useState<ReadonlySet<number>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const inFlight = useRef(new Set<number>());

  const view = checklistView(tasks);
  if (!view) return null;

  const press = async (task: PortalTask) => {
    const input = completionInput(task);
    if (!input || inFlight.current.has(task.id)) return;
    inFlight.current.add(task.id);
    setPending(new Set(inFlight.current));
    setNotice(null);
    const outcome = completeOutcome(await api.portal.completeItem(input), task.id);
    inFlight.current.delete(task.id);
    setPending(new Set(inFlight.current));
    switch (outcome.kind) {
      case "updated":
        return setTasks((list) => replaceTask(list, outcome.task));
      case "changed":
        setTasks((list) => replaceTask(list, outcome.task));
        return setNotice(TASK_CHANGED_NOTICE);
      case "reload":
        return onReload();
      case "signedOut":
        return onSessionEnded();
      case "failed":
        return setNotice(TASK_FAILED_NOTICE);
    }
  };

  return (
    <section className={`${styles.card} ${styles.noPrint}`} aria-labelledby="portal-checklist">
      <h2 id="portal-checklist" className={styles.h2}>Your checklist</h2>
      {view.summary ? <p className={styles.note}>{view.summary}</p> : null}
      <p className={`${styles.note} ${styles.notice}`} role="status" aria-live="polite" hidden={!notice}>{notice}</p>
      <ol className={styles.items}>
        {view.tasks.map((t) => (
          <TaskItem key={t.id} view={t} busy={pending.has(t.id)} onPress={() => { const task = tasks.find((x) => x.id === t.id); if (task) void press(task); }} />
        ))}
      </ol>
    </section>
  );
}

function TaskItem({ view, busy, onPress }: { readonly view: TaskView; readonly busy: boolean; readonly onPress: () => void }) {
  return (
    <li className={styles.item}>
      <h3 className={styles.h3}>
        {view.title}
        {view.required ? <span className={styles.tag}>Required</span> : null}
      </h3>
      {view.body ? <p className={styles.itemBody}>{view.body}</p> : null}
      {view.link ? <a className={styles.secondary} href={view.link} target="_blank" rel="noopener noreferrer">Open</a> : null}
      {view.doneLabel ? <p className={styles.done}>{view.doneLabel}</p> : null}
      {view.button && view.canComplete ? (
        <button type="button" className={styles.primary} disabled={busy} aria-busy={busy} onClick={onPress}>{busy ? "Saving…" : view.button}</button>
      ) : null}
    </li>
  );
}
