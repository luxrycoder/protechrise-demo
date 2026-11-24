import type { Metadata } from "next";
import Link from "next/link";
import { CopyLinkButton } from "@/features/thank-you/copy-link-button";
import { resolveTrackName, shareLinks } from "@/features/thank-you/thank-you";
import { loadTracks } from "@/lib/tracks";
import styles from "@/features/thank-you/thank-you.module.css";

export const metadata: Metadata = {
  title: "Application Received",
  description: "Your ProTech Rise Academy scholarship application has been received. Here's what happens next.",
  robots: { index: false, follow: true },
};

// Renders per request: it reads the query string and checks the track against the live track list.
export const dynamic = "force-dynamic";

type Props = { readonly searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ThankYouPage({ searchParams }: Props) {
  const [params, data] = await Promise.all([searchParams, loadTracks()]);
  const trackName = resolveTrackName(params.track, data?.tracks ?? null);

  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <div className={styles.badge}>Application Received</div>
        <h1 className={styles.title}>Thanks for applying!</h1>
        <p className={styles.lead}>
          {trackName
            ? `We've received your application for ${trackName}. Our admissions team reviews applications on a rolling basis — we'll email you as soon as there's an update.`
            : "We've received your scholarship application and our admissions team reviews applications on a rolling basis. We'll email you as soon as there's an update."}
        </p>

        <div className={styles.steps}>
          <h2>What happens next</h2>
          <ol>
            <li>Our admissions team reviews your application (rolling basis, no fixed deadline to hear back).</li>
            <li>You&apos;ll get an email confirming receipt, then another when there&apos;s a decision.</li>
            <li>If shortlisted, we may reach out for a short follow-up before a final decision.</li>
            <li>
              Want to check in sooner? Visit our <Link href="/status">status page</Link> any time and we&apos;ll email you a link.
            </li>
          </ol>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={`${styles.btn} ${styles.btnPrimary}`}>Back to homepage</Link>
          <Link href="/status" className={styles.btn}>Check Status</Link>
          <Link href="/faq" className={styles.btn}>Read the FAQ</Link>
        </div>

        <div className={styles.share}>
          <p>Know someone this could help? Share it with them.</p>
          <div className={styles.shareLinks}>
            {shareLinks().map((link) => (
              <a key={link.label} className={styles.shareLink} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
            <CopyLinkButton />
          </div>
        </div>
      </div>
    </section>
  );
}
