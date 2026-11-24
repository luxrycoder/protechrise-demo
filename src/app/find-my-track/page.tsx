import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/home/section-header";
import { parseAnswers } from "@/features/track-finder/matcher";
import { QUESTIONS } from "@/features/track-finder/questions";
import { TrackFinder } from "@/features/track-finder/track-finder";
import { HOME } from "@/content/home";
import { loadTracks } from "@/lib/tracks";

export const metadata: Metadata = {
  title: "Find your track",
  description: `Answer ${QUESTIONS.length} quick questions and we'll point you to the ProTech Rise Academy track that fits you.`,
};

// The quiz matches against the live track list, so this renders per request.
export const dynamic = "force-dynamic";

export default async function FindMyTrackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await loadTracks();
  const tracks = data?.tracks ?? [];

  return (
    <section className="sec" aria-labelledby="finder-title">
      <div className="container">
        <SectionHeader id="finder-title" label="Find your track" title="Not sure where to start?" sub={`${QUESTIONS.length} quick questions, and we'll show you the tracks that fit.`} />
        {tracks.length > 0 ? (
          <TrackFinder tracks={tracks} isOpen={data?.isOpen ?? false} initialAnswers={parseAnswers(await searchParams)} />
        ) : (
          <p>
            {HOME.tracks.unavailable} <Link href="/apply">Go to the application</Link>.
          </p>
        )}
      </div>
    </section>
  );
}
