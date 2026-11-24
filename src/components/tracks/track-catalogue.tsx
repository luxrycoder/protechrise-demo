"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CourseCardGrid } from "@/components/home/course-card-grid";
import { categoriesOf, filterTracks, type Track } from "@/lib/track-filters";
import styles from "./track-catalogue.module.css";

/**
 * Every track as the same interactive cards the homepage uses, with a category filter. All tracks render on the
 * server, so the list is complete without JavaScript; the chips only narrow it once the page has hydrated.
 */
export function TrackCatalogue({ tracks, isOpen = true }: { readonly tracks: readonly Track[]; readonly isOpen?: boolean }) {
  const categories = useMemo(() => categoriesOf(tracks), [tracks]);
  const wanted = useSearchParams().get("category");
  const [active, setActive] = useState<string | null>(wanted && categories.includes(wanted) ? wanted : null);
  const [seenParam, setSeenParam] = useState(wanted);
  if (wanted !== seenParam) {
    // The nav dropdown links here with ?category=...; no param (or "All tracks") clears the filter.
    setSeenParam(wanted);
    setActive(wanted && categories.includes(wanted) ? wanted : null);
  }
  const visible = filterTracks(tracks, active);

  return (
    <div>
      {categories.length > 1 ? (
        <div className={styles.filters} role="group" aria-label="Filter tracks by category">
          {[null, ...categories].map((category) => (
            <button key={category ?? "all"} type="button" className={styles.chip} aria-pressed={active === category} onClick={() => setActive(category)}>
              {category ?? "All tracks"}
            </button>
          ))}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} of {tracks.length} tracks
      </p>

      <CourseCardGrid tracks={visible} catalogue={tracks} apply={isOpen} />
    </div>
  );
}
