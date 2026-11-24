import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { CtaBand } from "@/components/home/cta-band";
import { ProcessSteps } from "@/components/home/process-steps";
import { SectionHeader } from "@/components/home/section-header";
import { StickyApplyBar } from "@/components/track/sticky-apply-bar";
import { CurriculumList } from "@/components/track/curriculum-list";
import { FeatureList } from "@/components/track/feature-list";
import { PitchBlock } from "@/components/track/pitch-block";
import { Reviews } from "@/components/track/reviews";
import { TutorList } from "@/components/track/tutor-list";
import { QuickFacts } from "@/components/track/quick-facts";
import { curriculumFor } from "@/content/curricula";
import { DEMO_REVIEWS } from "@/content/demo/reviews";
import { DEMO_TUTORS } from "@/content/demo/tutors";
import { HOME } from "@/content/home";
import { TESTIMONIALS } from "@/content/testimonials";
import { pitchFor } from "@/content/track-pitches";
import { demoContentEnabled, reviewsFor } from "@/lib/demo";
import { parseEnv } from "@/lib/env";
import { loadPublicFee } from "@/lib/fee";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, courseJsonLd } from "@/lib/json-ld";
import { absoluteUrl, loadSiteConfig } from "@/lib/site-config";
import { findTrack, loadTracks, relatedTracks, trackAccent, trackStats } from "@/lib/tracks";
import styles from "./track-page.module.css";

// Tracks, the fee and whether applications are open are live server data, so this renders per request.
export const dynamic = "force-dynamic";

const RELATED_LIMIT = 3;
const PROVIDER_NAME = "ProTech Rise Academy";

// What every track includes. Each line restates something the site already promises (home.ts process and the facts).
const FEATURES = [
  "Live classes in the evenings, 3 months, 100% online",
  "Tuition funded by the scholarship",
  "A certificate on completion",
  "Interview coaching and employer introductions",
  "A portfolio of real projects",
  "No experience needed: every track starts from the fundamentals",
] as const;

type Params = { readonly params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const track = findTrack((await loadTracks())?.tracks ?? [], slug);
  if (!track) return { title: "Track" };
  return {
    title: track.name,
    description: track.blurb ?? `${track.name}: a 3-month, live online track at ${PROVIDER_NAME}.`,
  };
}

export default async function TrackPage({ params }: Params) {
  const { slug } = await params;
  const [data, fee] = await Promise.all([loadTracks(), loadPublicFee()]);

  // API unreachable: say so honestly instead of pretending the track does not exist.
  if (data === null) {
    return (
      <section className="sec">
        <div className="container">
          <h1 className="sec-title">This track is temporarily unavailable</h1>
          <p className={styles.lede}>We could not load the track details just now. Please try again in a moment.</p>
          <Link href="/#tracks" className="btn btn-ghost">
            Back to all tracks
          </Link>
        </div>
      </section>
    );
  }

  const track = findTrack(data.tracks, slug);
  if (!track) notFound();

  const { siteUrl } = loadSiteConfig();
  const related = relatedTracks(data.tracks, slug, RELATED_LIMIT);
  const stats = trackStats(track);
  const curriculum = curriculumFor(track.slug);
  const pitch = pitchFor(track.slug);
  const demo = demoContentEnabled(parseEnv(process.env).noindex);
  const tutors = demo ? DEMO_TUTORS.filter((t) => t.trackSlug === track.slug) : [];
  const reviews = reviewsFor(track.slug, TESTIMONIALS, DEMO_REVIEWS, demo);
  const facts: { label: string; value: string }[] = [
    ...(track.category ? [{ label: "Category", value: track.category }] : []),
    { label: "Level", value: "Beginner" },
    { label: "Format", value: "3 months, live evenings" },
    { label: "Delivery", value: "100% online" },
    { label: "Tuition", value: "Funded by the scholarship" },
    ...(fee ? [{ label: "Onboarding/certification fee", value: fee }] : []),
  ];

  return (
    <>
      <StickyApplyBar trackSlug={track.slug} trackName={track.name} />
      <section
        className={styles.hero}
        style={{ "--accent": trackAccent(track.color) } as CSSProperties}
        aria-labelledby="track-title"
      >
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <p className={styles.category}>{track.category ?? "Career track"}</p>
            <h1 id="track-title" className={styles.title}>
              {track.name}
            </h1>
            {track.blurb ? <p className={styles.lede}>{track.blurb}</p> : null}
            {stats.length > 0 ? (
              <ul className={styles.stats} aria-label="Track level and enrolment">
                {stats.map((stat) => (
                  <li key={stat}>{stat}</li>
                ))}
              </ul>
            ) : null}
            <div className={styles.actions}>
              <Link href={`/apply?track=${encodeURIComponent(track.slug)}`} className="btn btn-primary">
                Apply for this track →
              </Link>
              <Link href="/#tracks" className="btn btn-ghost">
                All tracks
              </Link>
            </div>
          </div>
          <div className={styles.art} aria-hidden="true" />
        </div>
      </section>

      <section className="sec" aria-label="Track details">
        <div className="container">
          <QuickFacts facts={facts} />
          <p className={styles.note}>{HOME.tracks.note}</p>
          <PitchBlock pitch={pitch} />
        </div>
      </section>

      {curriculum ? (
        <section className="sec" aria-labelledby="curriculum-title">
          <div className="container">
            <h2 id="curriculum-title" className="sec-title">
              What You&apos;ll Learn
            </h2>
            <CurriculumList modules={curriculum.modules} />
          </div>
        </section>
      ) : null}

      {tutors.length > 0 ? (
        <section className="sec" aria-labelledby="tutors-title">
          <div className="container">
            <h2 id="tutors-title" className="sec-title">
              Meet your {tutors.length > 1 ? "tutors" : "tutor"}
            </h2>
            <TutorList tutors={tutors} demo />
          </div>
        </section>
      ) : null}

      {reviews.length > 0 ? (
        <section className="sec" aria-labelledby="reviews-title">
          <div className="container">
            <h2 id="reviews-title" className="sec-title">
              What students say
            </h2>
            <Reviews reviews={reviews} />
          </div>
        </section>
      ) : null}

      <section className="sec" aria-labelledby="included-title">
        <div className="container">
          <h2 id="included-title" className="sec-title">
            What&apos;s included
          </h2>
          <FeatureList features={FEATURES} />
        </div>
      </section>

      <section className="sec" aria-labelledby="process-title" style={{ background: "var(--color-bg-wash)" }}>
        <div className="container">
          <SectionHeader id="process-title" {...HOME.process} />
          <ProcessSteps />
        </div>
      </section>

      {related.length > 0 ? (
        <section className="sec" aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title" className="sec-title">
              More in {track.category}
            </h2>
            <ul className={styles.related}>
              {related.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tracks/${encodeURIComponent(t.slug)}`}>
                    <strong>{t.name}</strong>
                    {t.blurb ? <span>{t.blurb}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CtaBand isOpen={data.isOpen} />

      <JsonLd data={courseJsonLd(track, PROVIDER_NAME)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: absoluteUrl(siteUrl, "/") },
          { name: "Tracks", url: absoluteUrl(siteUrl, "/#tracks") },
          { name: track.name, url: absoluteUrl(siteUrl, `/tracks/${encodeURIComponent(track.slug)}`) },
        ])}
      />
    </>
  );
}
