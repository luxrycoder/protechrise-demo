"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { Peep } from "@/components/art/peep";
import { useInView } from "@/components/use-in-view";
import { curriculumFor } from "@/content/curricula";
import { groupIntoLines, lineLetter, weeksOf, type LineKey } from "@/lib/track-lines";
import { trackStats, type Track } from "@/lib/track-filters";
import styles from "./tracks-map.module.css";

const LINE_CLASS: Record<LineKey, string | undefined> = {
  build: styles.build,
  infra: styles.infra,
  data: styles.data,
  product: styles.product,
  biz: styles.biz,
};

const WEEKS = 12;

/**
 * The tracks as a transit map: each category is a coloured line and each track a station on it. Pick a station to see its
 * 12-week route (the real curriculum) and where to go next. Everything shown comes from the live track list.
 */
export function TracksMap({ tracks }: { readonly tracks: readonly Track[] }) {
  const lines = useMemo(() => groupIntoLines(tracks), [tracks]);
  const [slug, setSlug] = useState(tracks[0]?.slug ?? "");
  const [ref, seen] = useInView<HTMLDivElement>(0.15);

  const line = lines.find((l) => l.tracks.some((t) => t.slug === slug)) ?? lines[0];
  const track = line?.tracks.find((t) => t.slug === slug) ?? line?.tracks[0];
  if (!line || !track) return null;

  const curriculum = curriculumFor(track.slug);
  const stats = trackStats(track);
  const index = tracks.findIndex((t) => t.slug === track.slug) + 1;

  return (
    <div ref={ref} className={`${styles.wrap} ${seen ? styles.in : ""}`}>
      <div className={styles.map} role="group" aria-label="Choose a track">
        {lines.map((l, li) => (
          <div key={l.name} className={`${styles.line} ${LINE_CLASS[l.key] ?? ""}`} style={{ "--d": `${li * 140}ms` } as React.CSSProperties}>
            <div className={styles.lineHead}>
              <span className={styles.lineBadge} aria-hidden="true">
                {lineLetter(l.name)}
              </span>
              <span className={styles.lineName}>{l.name}</span>
            </div>
            <div className={styles.rail}>
              <span className={styles.bar} aria-hidden="true" />
              <ul className={styles.stops}>
                {l.tracks.map((t) => {
                  const on = t.slug === track.slug;
                  return (
                    <li key={t.slug}>
                      <button
                        type="button"
                        className={`${styles.stop} ${on ? styles.on : ""}`}
                        aria-pressed={on}
                        onClick={() => setSlug(t.slug)}
                        onMouseEnter={() => setSlug(t.slug)}
                        onFocus={() => setSlug(t.slug)}
                      >
                        <span className={styles.dot} aria-hidden="true" />
                        <span className={styles.stopName}>{t.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
        <p className={styles.legend}>
          <span className="mono-label">{tracks.length} tracks</span> · {lines.length} lines · every track is 3 months, live in the evenings
        </p>
      </div>

      <aside className={`${styles.panel} ${LINE_CLASS[line.key] ?? ""}`} aria-live="polite">
        <span className={styles.peep} aria-hidden="true">
          <Peep size={130} fill="white" slot={`line-${line.key}`} />
        </span>
        <div key={track.slug} className={styles.panelBody}>
          <p className={`mono-label ${styles.panelKicker}`}>
            <span className={styles.panelBadge}>{lineLetter(line.name)}</span>
            {line.name} · Station {String(index).padStart(2, "0")}
          </p>
          <h3 className={styles.panelTitle}>{track.name}</h3>
          {track.blurb ? <p className={styles.panelBlurb}>{track.blurb}</p> : null}
          {track.instructor || stats.length > 0 ? (
            <ul className={styles.stats}>
              {track.instructor ? <li>Taught by {track.instructor}</li> : null}
              {stats.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : null}

          {curriculum ? (
            <div className={styles.route}>
              <p className={`mono-label ${styles.routeLabel}`}>Your 12-week route</p>
              <div className={styles.weeks} role="img" aria-label={`${curriculum.modules.length} modules across ${WEEKS} weeks`}>
                {curriculum.modules.map((m, i) => {
                  const w = weeksOf(m.duration);
                  if (!w) return null;
                  return (
                    <span
                      key={m.title}
                      className={styles.seg}
                      style={{ gridColumn: `${w.start} / ${Math.min(w.end, WEEKS) + 1}`, "--i": i } as React.CSSProperties}
                      title={`${m.duration}: ${m.title}`}
                    />
                  );
                })}
              </div>
              <div className={styles.weekNums} aria-hidden="true">
                <span>W1</span>
                <span>W6</span>
                <span>W12 → first paid role</span>
              </div>
              <ol className={styles.modules}>
                {curriculum.modules.slice(0, 4).map((m) => (
                  <li key={m.title}>
                    <span className={styles.modWeeks}>{m.duration?.replace("Weeks ", "W").replace("Week ", "W")}</span>
                    {m.title}
                  </li>
                ))}
                {curriculum.modules.length > 4 ? <li className={styles.more}>+ {curriculum.modules.length - 4} more stations</li> : null}
              </ol>
            </div>
          ) : null}

          <div className={styles.actions}>
            <Link href={`/apply?track=${encodeURIComponent(track.slug)}`} className={`btn ${styles.apply}`}>
              Apply to this track <ArrowRight weight="bold" size={16} aria-hidden="true" />
            </Link>
            <Link href={`/tracks/${encodeURIComponent(track.slug)}`} className={styles.details}>
              Full details <ArrowUpRight weight="bold" size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
