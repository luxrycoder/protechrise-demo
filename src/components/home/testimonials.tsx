"use client";

import { useMemo, useState } from "react";
import type { Testimonial } from "@/content/types";
import { initialsOf } from "@/lib/track-filters";
import { ALL_SEGMENT, fillRow, segmentsOf } from "@/lib/testimonial-segments";
import { PlatformIcon, platformLabel } from "./platform-icon";
import styles from "./testimonials.module.css";

/** A single story has nothing to loop past; two or more scroll. */
const MIN_CARDS_TO_SCROLL = 2;
/** A set holds at least this many cards (short segments repeat theirs), enough to fill a wide screen. */
const CARDS_PER_SET = 6;
/** Seconds each card spends crossing the row, so the pace stays the same whatever the segment's size. */
const SECONDS_PER_CARD = 10;

function Card({ t, filler }: { readonly t: Testimonial; readonly filler: boolean }) {
  return (
    <li className={styles.testimonial} data-filler={filler} aria-hidden={filler ? true : undefined}>
      <figure>
        <blockquote className={styles.quote}>
          <p>“{t.quote}”</p>
        </blockquote>
        <figcaption className={styles.who}>
          <span className={styles.avatar} aria-hidden="true">
            {initialsOf(t.name)}
          </span>
          <span>
            <span className={styles.whoName}>{t.name}</span>
            <span className={styles.whoRole}>{t.role}</span>
          </span>
        </figcaption>
        <ul className={styles.tags} aria-label="Track and highlights">
          {t.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <p className={styles.postSource}>
          {t.source ? (
            <a href={t.source.url} target="_blank" rel="noopener noreferrer" className={styles.testimonialSource}>
              <PlatformIcon platform={t.source.platform} />
              <span className={styles.testimonialSourceLabel}>View original post on {platformLabel(t.source.platform)}</span>
              <span aria-hidden="true" className={styles.testimonialSourceArrow}>
                ↗
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <span className={styles.storyLabel}>Student story</span>
          )}
        </p>
      </figure>
    </li>
  );
}

/**
 * Testimonials as a slow, continuous ticker (like the countries one), segmented by the social platform
 * the original post lives on. Every card renders on the server, so the section is complete without
 * JavaScript; the chips only narrow the list once the page has hydrated. It pauses on hover and focus.
 */
export function Testimonials({ items }: { readonly items: readonly Testimonial[] }) {
  const segments = useMemo(() => segmentsOf(items), [items]);
  const [activeKey, setActiveKey] = useState(ALL_SEGMENT);
  const active = segments.find((s) => s.key === activeKey) ?? segments[0];
  const animated = active.items.length >= MIN_CARDS_TO_SCROLL;

  const row = fillRow(active.items, animated ? CARDS_PER_SET : 1);
  const setSize = row.length;
  const cards = row.map(({ item, copy }) => (
    <Card key={`${item.source?.url ?? item.name}#${copy}`} t={item} filler={copy > 0} />
  ));

  return (
    <div>
      {segments.length > 1 ? (
        <div className={styles.segments} role="group" aria-label="Filter stories by where they were shared">
          {segments.map((segment) => (
            <button
              key={segment.key}
              type="button"
              className={styles.segment}
              aria-pressed={segment.key === active.key}
              onClick={() => setActiveKey(segment.key)}
            >
              {segment.platform ? <PlatformIcon platform={segment.platform} /> : null}
              {segment.label} <span className={styles.segmentCount}>{segment.items.length}</span>
            </button>
          ))}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        Showing {active.items.length} of {items.length} stories
      </p>

      <div className={styles.marquee} data-animated={animated}>
        {/* Keyed so switching segment restarts the loop from the first card. */}
        <div
          key={active.key}
          className={styles.marqueeTrack}
          style={animated ? { animationDuration: `${setSize * SECONDS_PER_CARD}s` } : undefined}
        >
          <ul className={styles.marqueeSet} aria-label="Student stories">
            {cards}
          </ul>
          {/* The looping copy: hidden from assistive tech and keyboard, so each story is announced and tabbed to once. */}
          {animated ? (
            <ul className={styles.marqueeSet} aria-hidden="true" inert>
              {cards}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
