import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { CtaBand } from "@/components/home/cta-band";
import { GlobalReach } from "@/components/home/global-reach";
import { Hero } from "@/components/home/hero";
import { SectionHeader } from "@/components/home/section-header";
import { Testimonials } from "@/components/home/testimonials";
import { TracksMap } from "@/components/home/tracks-map";
import { WhoItsFor } from "@/components/home/who-its-for";
import { Community } from "@/components/home/community";
import { Reveal } from "@/components/reveal";
import { Road } from "@/components/home/road";
import { HOME } from "@/content/home";
import { TESTIMONIALS } from "@/content/testimonials";
import { HOME_FAQ } from "@/content/home-faq";
import { JsonLd } from "@/components/json-ld";
import { loadApplicantCountries } from "@/lib/applicant-countries";
import { loadPublicTerms } from "@/lib/fee";
import { organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";
import { loadSiteConfig } from "@/lib/site-config";
import { loadTracks } from "@/lib/tracks";
import styles from "@/components/home/home.module.css";

// Tracks, whether applications are open, and the fee are live server data, so this renders per request
// (each API call is cached for 60 seconds). If the API is down the page degrades instead of failing.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [tracksData, terms, applicantCountries] = await Promise.all([
    loadTracks(),
    loadPublicTerms(),
    loadApplicantCountries(),
  ]);
  const tracks = tracksData?.tracks ?? [];
  const trackCount = tracks.length > 0 ? tracks.length : null;
  const isOpen = tracksData?.isOpen ?? false;
  const { siteUrl, siteName } = loadSiteConfig();

  return (
    <>
      <JsonLd data={organizationJsonLd(siteUrl, siteName)} />
      <JsonLd data={websiteJsonLd(siteUrl, siteName)} />
      <Hero trackCount={trackCount} />

      <section id="how-it-works" className="sec" aria-labelledby="how-title" style={{ background: "var(--night)", color: "#fff" }}>
        <div className="container">
          <Reveal from="left">
            <SectionHeader id="how-title" onDark label={HOME.process.label} title={HOME.process.title} sub={HOME.process.sub} />
          </Reveal>
          <Reveal from="fade"><Road /></Reveal>
        </div>
      </section>

      <section id="tracks" className="sec" aria-labelledby="tracks-title">
        <div className="container">
          <Reveal from="left">
            <SectionHeader id="tracks-title" {...HOME.tracks} />
          </Reveal>
          {tracks.length > 0 ? (
            <Reveal from="right"><TracksMap tracks={tracks} /></Reveal>
          ) : (
            <p className={styles.unavailable}>{HOME.tracks.unavailable}</p>
          )}
          <p className={styles.note}>{HOME.tracks.note}</p>
          {tracks.length > 0 ? (
            <p className={styles.finderLink}>
              Not sure where to start? <Link href="/find-my-track">Find your track →</Link>
            </p>
          ) : null}
        </div>
      </section>

      <GlobalReach data={applicantCountries} />

      <section className="sec" aria-labelledby="community-title">
        <div className="container">
          <Reveal from="left">
            <SectionHeader id="community-title" {...HOME.community} />
          </Reveal>
          <Reveal from="up"><Community /></Reveal>
        </div>
      </section>

      <section id="scholars" className={`sec ${styles.cool}`} aria-labelledby="scholars-title">
        <div className="container">
          <Reveal from="left">
            <SectionHeader id="scholars-title" {...HOME.testimonials} />
          </Reveal>
          <Reveal from="up"><Testimonials items={TESTIMONIALS} /></Reveal>
        </div>
      </section>

      <section className="sec" aria-labelledby="who-title">
        <div className="container">
          <Reveal from="left">
            <SectionHeader id="who-title" {...HOME.whoItsFor} />
          </Reveal>
          <Reveal from="right"><WhoItsFor /></Reveal>
        </div>
      </section>

      <section className="sec" aria-labelledby="faq-title">
        <div className="container">
          <Reveal from="left">
            <SectionHeader id="faq-title" label={HOME.faq.label} title={HOME.faq.title} sub={HOME.faq.sub} />
          </Reveal>
          <Reveal from="up"><div style={{ maxWidth: 960 }}><FaqList items={HOME_FAQ} terms={terms} /></div></Reveal>
          <Link href="/faq" className={styles.moreLink}>
            {HOME.faq.more} →
          </Link>
        </div>
      </section>

      <CtaBand isOpen={isOpen} />
    </>
  );
}
