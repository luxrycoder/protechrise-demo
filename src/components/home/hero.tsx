import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChartLineUp, Code, CloudArrowUp, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { HOME } from "@/content/home";
import styles from "./hero.module.css";

type Props = {
  readonly trackCount: number | null;
};

/**
 * The home hero: a paper collage of cut-out learners riding one emerald line toward a first paid role.
 * Pure CSS motion (no client JS), and every animation is switched off under prefers-reduced-motion.
 */
export function Hero({ trackCount }: Props) {
  const { hero, campaign } = HOME;
  const proof = [
    `${campaign.spots} scholarship spots`,
    trackCount === null ? "Career-focused tracks" : `${trackCount} career-focused tracks`,
    `${campaign.cohortLabel} cohort`,
    "100% online",
  ];

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <h1 id="hero-title" className={styles.title}>
            {hero.headline.map((line, i) => (
              <span key={line} className={`${styles.line} ${i === 0 ? styles.l1 : styles.l2}`}>
                {line}
              </span>
            ))}
            <span className={`${styles.line} ${styles.l3}`}>
              <em>{hero.emphasis}</em>
            </span>
          </h1>
          <p className={styles.sub}>{hero.sub}</p>
          <div className={styles.actions}>
            <Link href="/apply" className={`btn btn-primary ${styles.cta}`}>
              {hero.cta.replace(" →", "")} <ArrowRight weight="bold" size={18} aria-hidden="true" />
            </Link>
            <Link href="/find-my-track" className={styles.finder}>
              Not sure? Find my track <ArrowUpRight weight="bold" size={16} aria-hidden="true" />
            </Link>
          </div>
          <ul className={styles.proof}>
            {proof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={styles.collage} aria-hidden="true">
          <span className={styles.halftone} />
          <span className={styles.halftoneSmall} />

          {/* The line: an emerald ribbon with stations, ending at the first paid role. */}
          <svg className={styles.ribbon} viewBox="0 0 600 640" focusable="false">
            <path className={styles.ribbonBase} d="M-20 262 C 70 262, 130 214, 214 176 S 420 120, 640 74" />
            <path className={styles.ribbonDash} d="M-20 262 C 70 262, 130 214, 214 176 S 420 120, 640 74" />
            <g className={styles.stations}>
              <circle cx="52" cy="258" r="13" />
              <circle cx="176" cy="196" r="13" />
              <circle cx="410" cy="125" r="13" />
              <circle cx="532" cy="98" r="13" />
            </g>
          </svg>

          <div className={`${styles.cut} ${styles.cutA}`}>
            <span className={`${styles.disc} ${styles.discBlue}`} />
            <Image src="/images/hero/s1.webp" alt="" width={540} height={900} priority sizes="(max-width: 900px) 40vw, 220px" />
          </div>
          <div className={`${styles.cut} ${styles.cutB}`}>
            <span className={`${styles.disc} ${styles.discGreen}`} />
            <Image src="/images/hero/s6.webp" alt="" width={540} height={900} priority sizes="(max-width: 900px) 50vw, 300px" />
          </div>
          <div className={`${styles.cut} ${styles.cutC}`}>
            <span className={`${styles.disc} ${styles.discOrange}`} />
            <Image src="/images/hero/s5.webp" alt="" width={540} height={900} priority sizes="(max-width: 900px) 40vw, 230px" />
          </div>

          <div className={styles.platform} />

          <span className={`${styles.tape} ${styles.tapeA}`} />
          <span className={`${styles.tape} ${styles.tapeB}`} />

          <span className={`${styles.sticker} ${styles.stkCode}`}>
            <Code weight="bold" size={26} />
          </span>
          <span className={`${styles.sticker} ${styles.stkCloud}`}>
            <CloudArrowUp weight="bold" size={26} />
          </span>
          <span className={`${styles.sticker} ${styles.stkChart}`}>
            <ChartLineUp weight="bold" size={26} />
          </span>
          <span className={`${styles.sticker} ${styles.stkShield}`}>
            <ShieldCheck weight="bold" size={26} />
          </span>

          <div className={styles.board}>
            <span className={styles.boardDot} />
            <span>Next departure</span>
            <b>{campaign.cohortLabel}</b>
            <span>Evenings · 12 weeks</span>
          </div>

          <p className={styles.dest}>
            First paid role
            <ArrowRight weight="bold" size={12} />
          </p>

          <div className={styles.torn}>
            <p className={styles.tornBig}>
              {Number(campaign.spots).toLocaleString("en-US")} seats.
              <br />
              One scholarship.
            </p>
            <p className={styles.tornSub}>Tuition funded. You pay only a small certificate fee.</p>
          </div>

          <Link href="/apply" className={styles.stamp} tabIndex={-1} aria-hidden="true">
            <svg viewBox="0 0 160 160" focusable="false" className={styles.stampRing}>
              <defs>
                <path id="stamp-circle" d="M80 80 m-58 0 a58 58 0 1 1 116 0 a58 58 0 1 1 -116 0" />
              </defs>
              <text>
                <textPath href="#stamp-circle" textLength="352" lengthAdjust="spacing">APPLY NOW ✦ APPLY NOW ✦ APPLY NOW ✦</textPath>
              </text>
            </svg>
            <span className={styles.stampCore}>
              <ArrowUpRight weight="bold" size={32} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
