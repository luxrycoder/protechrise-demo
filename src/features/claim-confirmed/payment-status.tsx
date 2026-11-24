"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAX_ATTEMPTS, POLL_INTERVAL_MS, describeAttempt, type ConfirmedView, type PaidView } from "@/features/claim-confirmed/confirmed";
import { createApi } from "@/lib/api";
import styles from "@/features/claim-confirmed/claim-confirmed.module.css";

const api = createApi();

const WHATSAPP_URL = "https://chat.whatsapp.com/DhDTNgQxm5JFle18Rj9vtc";
const TELEGRAM_URL = "https://t.me/protechrise_academy";

type Props = { readonly reference: string };

/**
 * The page after Paystack sends the applicant back. It only reads what the API has recorded; access is granted by
 * the payment webhook alone, so showing "paid" here is information, never the thing that enrols anyone.
 */
export function PaymentStatus({ reference }: Props) {
  const [view, setView] = useState<ConfirmedView>(reference ? { kind: "loading" } : { kind: "error" });

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const attempt = async (n: number): Promise<void> => {
      const result = await api.claim.confirmed(reference);
      if (cancelled) return;
      const step = describeAttempt(result, n);
      setView(step.view);
      if (step.poll && n < MAX_ATTEMPTS) timer = setTimeout(() => void attempt(n + 1), POLL_INTERVAL_MS);
    };
    void attempt(1);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference]);

  switch (view.kind) {
    case "loading":
      return (
        <div role="status">
          <div className={styles.spinner} aria-hidden="true" />
          <h1 className={styles.title}>Checking your payment…</h1>
          <p className={styles.lead}>One moment while we confirm your scholarship commitment fee.</p>
        </div>
      );
    case "paid":
      return <Paid view={view} />;
    case "pending":
      return (
        <div role="status">
          <div className={`${styles.badge} ${styles.badgePending}`}>Finalising</div>
          <h1 className={styles.title}>Almost there</h1>
          <p className={styles.lead}>{view.message}</p>
          <div className={styles.actions}>
            <Link href="/status" className={`${styles.btn} ${styles.btnPrimary}`}>Check your status</Link>
            {view.retryUrl ? <a href={view.retryUrl} className={styles.btn}>Try payment again</a> : null}
          </div>
        </div>
      );
    case "error":
      return (
        <div>
          <div className={`${styles.badge} ${styles.badgePending}`}>Not confirmed yet</div>
          <h1 className={styles.title}>We couldn&apos;t match this payment</h1>
          <p className={styles.lead}>
            If you completed payment, your confirmation email is on its way — please check your inbox. You can also check your enrolment on the status page.
          </p>
          <div className={styles.actions}>
            <Link href="/status" className={`${styles.btn} ${styles.btnPrimary}`}>Check your status</Link>
            <Link href="/" className={styles.btn}>Back to homepage</Link>
          </div>
        </div>
      );
  }
}

function Paid({ view }: { readonly view: PaidView }) {
  return (
    <div role="status">
      <div className={`${styles.badge} ${styles.badgePaid}`}>Payment received</div>
      <h1 className={styles.title}>{view.heading}</h1>
      <p className={styles.lead}>Welcome to ProTech Rise Academy — your scholarship place is secured.</p>
      {view.studentId ? <div className={styles.studentId}>Student ID  {view.studentId}</div> : null}
      <ul className={styles.facts}>
        {view.facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <div className={styles.steps}>
        <h2>What happens next</h2>
        <ol>
          <li>Check your inbox — your payment confirmation and <strong>Student ID</strong> are on the way.</li>
          <li>
            {view.communityHref
              ? "Join the scholar community to meet your cohort and get onboarding updates."
              : "Join the WhatsApp and Telegram communities below to meet your cohort."}
          </li>
          <li>
            You can review your enrolment any time on the <Link href="/status">status page</Link> — we&apos;ll email you a sign-in link.
          </li>
        </ol>
      </div>
      <div className={styles.actions}>
        {view.communityHref ? <a href={view.communityHref} className={`${styles.btn} ${styles.btnPrimary}`}>Join the community</a> : null}
        <Link href="/status" className={styles.btn}>Check your enrolment</Link>
        <Link href="/" className={styles.btn}>Back to homepage</Link>
      </div>
      <div className={styles.share}>
        <p>Reach the academy team and your cohort here:</p>
        <div className={styles.shareLinks}>
          <a className={styles.shareLink} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp community</a>
          <a className={styles.shareLink} href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">Telegram channel</a>
        </div>
      </div>
    </div>
  );
}
