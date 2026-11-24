import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { trackAccent, trackStats, type Track } from "@/lib/track-filters";
import styles from "./track-list.module.css";

/**
 * Tracks as a timetable: one row per track with a colour bar, name, blurb and the two actions. Used by /tracks and the
 * track finder. `catalogue` is the full list, so a track keeps the same number wherever it appears.
 */
export function CourseCardGrid({
  tracks,
  catalogue,
  apply = true,
}: {
  readonly tracks: readonly Track[];
  readonly catalogue: readonly Track[];
  /** Show "Apply". False while applications are closed. */
  readonly apply?: boolean;
}) {
  return (
    <ol className={styles.list}>
      {tracks.map((track) => {
        const n = Math.max(0, catalogue.findIndex((t) => t.slug === track.slug)) + 1;
        const stats = trackStats(track);
        return (
          <li key={track.slug} className={styles.row} style={{ "--c": trackAccent(track.color) } as React.CSSProperties}>
            <span className={`mono-label ${styles.num}`}>{String(n).padStart(2, "0")}</span>
            <div className={styles.main}>
              <h3 className={styles.name}>
                <Link href={`/tracks/${encodeURIComponent(track.slug)}`}>{track.name}</Link>
              </h3>
              {track.blurb ? <p className={styles.blurb}>{track.blurb}</p> : null}
              <p className={styles.meta}>{[track.category, ...stats].filter(Boolean).join(" · ")}</p>
            </div>
            <div className={styles.actions}>
              {apply ? (
                <Link href={`/apply?track=${encodeURIComponent(track.slug)}`} className={`btn btn-primary ${styles.apply}`}>
                  Apply <ArrowRight weight="bold" size={15} aria-hidden="true" />
                </Link>
              ) : null}
              <Link href={`/tracks/${encodeURIComponent(track.slug)}`} className={styles.details}>
                Details <ArrowUpRight weight="bold" size={14} aria-hidden="true" />
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
