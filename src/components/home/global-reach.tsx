import { flagFor } from "@/features/application/geo";
import type { ApplicantCountriesData } from "@/lib/applicant-countries";
import { demoDataEnabled } from "@/lib/demo-data";
import { HOME } from "@/content/home";
import { Reveal } from "@/components/reveal";
import { SectionHeader } from "./section-header";
import styles from "./global-reach.module.css";

const MAX_DISPLAYED = 8;

type Props = { readonly data: ApplicantCountriesData | null };

/** Hidden entirely when there's no live data: a made-up country list would be a false trust signal. */
export function GlobalReach({ data }: Props) {
  if (data === null || data.countries.length === 0) return null;
  const shown = data.countries.slice(0, MAX_DISPLAYED);
  const max = Math.max(...shown.map((c) => c.count));
  return (
    <section className={`sec ${styles.section}`} aria-labelledby="global-reach-title">
      <div className="container">
        <SectionHeader id="global-reach-title" {...HOME.globalReach} />
        <Reveal from="right">
        <div className={styles.board}>
          <div className={styles.head} aria-hidden="true">
            <span>Applicants from</span>
            <span>{demoDataEnabled() ? "Count · demo data" : "Count"}</span>
          </div>
          <ol className={styles.rows}>
            {shown.map((c, i) => (
              <li key={c.name} className={styles.row} style={{ "--i": i } as React.CSSProperties}>
                <span className={styles.flag} aria-hidden="true">{flagFor(c.name)}</span>
                <span className={styles.name}>{c.name}</span>
                <span className={styles.track} aria-hidden="true">
                  <span className={styles.fill} style={{ width: `${Math.max(4, (c.count / max) * 100)}%` }} />
                </span>
                <span className={styles.count}>{c.count.toLocaleString("en-US")}</span>
              </li>
            ))}
          </ol>
          <p className={styles.total}>
            <strong>{data.totalCountries}+</strong> countries and counting
          </p>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
