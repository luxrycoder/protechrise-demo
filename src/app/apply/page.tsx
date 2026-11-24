import type { Metadata } from "next";
import Link from "next/link";
import { initialTrackName } from "@/features/application/initial-track";
import { ApplicationForm } from "@/features/application/application-form";
import { APPLY_PAY } from "@/content/apply-pay";
import { HOME } from "@/content/home";
import { fillTokens, loadPublicTerms } from "@/lib/fee";
import { loadTracks } from "@/lib/tracks";
import styles from "@/features/application/application.module.css";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply for a ProTech Rise Academy scholarship. Submit your application for the current cohort.",
};

// Open or closed, the track list, the application flow and the prices are live server data, so this renders per request.
export const dynamic = "force-dynamic";

export default async function ApplyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [data, terms] = await Promise.all([loadTracks(), loadPublicTerms()]);
  // The open cohort decides the application: the one-screen apply-and-pay form, or the three-step scholarship one.
  const flow = data?.payAtApply ? "payAtApply" : "award";

  return (
    <>
      <section className={styles.hero} aria-labelledby="apply-title">
        <div className="container">
          {flow === "payAtApply" ? (
            <>
              <p className={styles.eyebrow}>{APPLY_PAY.eyebrow}</p>
              <h1 id="apply-title" className={styles.heroTitle}>
                {fillTokens(APPLY_PAY.title, terms)}
              </h1>
              <p className={styles.heroSub}>{fillTokens(APPLY_PAY.sub, terms)}</p>
              <p className={styles.byline}>{APPLY_PAY.byline}</p>
            </>
          ) : (
            <>
              <p className={styles.eyebrow}>Scholarship Application · {HOME.campaign.cohortLabel} Cohort</p>
              <h1 id="apply-title" className={styles.heroTitle}>
                Every scholar has a story before the offer letter.
              </h1>
              <p className={styles.heroSub}>
                This application is where yours starts. We ask about your goals, your circumstances, and the barriers standing between you and a
                tech career, because that&apos;s what actually helps us decide who needs this scholarship most.
              </p>
              <p className={styles.urgency}>Scholarships are limited and reviewed on a rolling basis. Apply early.</p>
              <p className={styles.byline}>ProTech Rise Academy · 8 minute application</p>
            </>
          )}
        </div>
      </section>

      <section className="sec" aria-label="Application form">
        <div className="container">
          {data === null ? (
            <div className={styles.notice} role="status">
              <strong>We could not load the application right now.</strong> Please reload the page in a moment.
            </div>
          ) : !data.isOpen ? (
            <div className={styles.notice} role="status">
              <strong>Applications are closed right now.</strong> Please check back soon, or read the <Link href="/faq">FAQ</Link>.
            </div>
          ) : (
            <ApplicationForm tracks={data.tracks} terms={terms} flow={flow} initialTrack={initialTrackName((await searchParams).track, data.tracks)} />
          )}
        </div>
      </section>
    </>
  );
}
