import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SectionHeader } from "@/components/home/section-header";
import { TrackCatalogue } from "@/components/tracks/track-catalogue";
import { HOME } from "@/content/home";
import { loadTracks } from "@/lib/tracks";
import homeStyles from "@/components/home/home.module.css";

// Tracks are live server data, so this renders per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All tracks",
  description: "Every career-focused track at ProTech Rise Academy: 3 months, live online in the evenings.",
};

/** Every track, with the category filter. The homepage only shows the first few and links here. */
export default async function TracksPage() {
  const data = await loadTracks();
  const tracks = data?.tracks ?? [];

  return (
    <section className="sec" aria-labelledby="all-tracks-title">
      <div className="container">
        <SectionHeader id="all-tracks-title" label={HOME.tracks.label} title="All Career-Focused Tracks" sub={HOME.tracks.sub} />
        {tracks.length > 0 ? (
          <>
            <Suspense fallback={null}>
              <TrackCatalogue tracks={tracks} isOpen={data?.isOpen ?? false} />
            </Suspense>
            <p className={homeStyles.note}>{HOME.tracks.note}</p>
            <p className={homeStyles.finderLink}>
              Not sure where to start? <Link href="/find-my-track">Find your track →</Link>
            </p>
          </>
        ) : (
          <p className={homeStyles.unavailable}>{HOME.tracks.unavailable}</p>
        )}
      </div>
    </section>
  );
}
