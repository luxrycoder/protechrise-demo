"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, CheckCircle, Moon, SealCheck, Ticket } from "@phosphor-icons/react";
import { InlineHtml } from "@/components/inline-html";
import { Peep } from "@/components/art/peep";
import { useScrollProgress } from "@/components/use-scroll-progress";
import { PROCESS_STEPS } from "@/content/home";
import styles from "./road.module.css";

const VB = { w: 1000, h: 1760 };
const ROWS_Y = [230, 640, 1050, 1460];
// The line weaves left and right of centre between stations and passes through each one.
const PATH =
  "M260 30 L 260 230 C 260 440, 740 430, 740 640 C 740 850, 260 840, 260 1050 " +
  "C 260 1260, 740 1250, 740 1460 C 740 1580, 500 1600, 500 1740";

function Vignette({ n }: { readonly n: number }) {
  if (n === 0) {
    return (
      <div className={styles.vTicket}>
        <p className="mono-label">Scholarship application</p>
        <strong>No experience needed</strong>
        <span className={styles.vStamp}>
          <CheckCircle weight="fill" size={18} /> Applied
        </span>
        <Ticket weight="duotone" size={64} className={styles.vIcon} />
      </div>
    );
  }
  if (n === 1) {
    return (
      <div className={styles.vScreen}>
        <div className={styles.vBar}>
          <span className={styles.vLive}>
            <i /> Live
          </span>
          <span>Evening class</span>
          <Moon weight="fill" size={16} />
        </div>
        <div className={styles.vTiles}>
          <i /> <i /> <i /> <i />
        </div>
        <p>Recorded, in case you miss one.</p>
      </div>
    );
  }
  if (n === 2) {
    return (
      <div className={styles.vBrowser}>
        <div className={styles.vBrowserTop}>
          <i /> <i /> <i />
          <span>Your portfolio</span>
        </div>
        <div className={styles.vWork}>
          <span className={styles.w1} />
          <span className={styles.w2} />
          <span className={styles.w3} />
          <span className={styles.w4} />
        </div>
        <p className="mono-label">Proof, not just a certificate</p>
      </div>
    );
  }
  return (
    <div className={styles.vOffer}>
      <Briefcase weight="duotone" size={72} />
      <p className="mono-label">Offer signed</p>
      <span className={styles.vSeal}>
        <SealCheck weight="fill" size={20} /> First paid role
      </span>
    </div>
  );
}

const FILL = ["mint", "sand", "blue", "purple"] as const;

/**
 * "How it works" as the evening line itself: a route that draws as you scroll, with a walker, four stations that light up
 * when reached, and a small illustrated scene at each. On narrow screens it becomes a simple vertical list.
 */
export function Road() {
  const [ref, progress] = useScrollProgress<HTMLDivElement>();
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(3000);
  const [walker, setWalker] = useState({ x: 500, y: 30 });

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, []);
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const at = Math.min(len, Math.max(0, len * progress));
    const pt = el.getPointAtLength(at);
    setWalker({ x: pt.x, y: pt.y });
  }, [progress, len]);

  return (
    <div className={styles.road} ref={ref} style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      <svg className={styles.svg} viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true" focusable="false">
        <path d={PATH} className={styles.bed} />
        <path ref={pathRef} d={PATH} className={styles.run} style={{ strokeDasharray: len, strokeDashoffset: len * (1 - progress) }} />
      </svg>

      <div className={styles.walker} style={{ left: `${(walker.x / VB.w) * 100}%`, top: `${(walker.y / VB.h) * 100}%` }} aria-hidden="true">
        <Peep size={64} fill="mint" slot="walker" />
      </div>

      {PROCESS_STEPS.map((step, i) => {
        const y = ROWS_Y[i] ?? 0;
        const reached = progress >= (y - 80) / VB.h;
        const flip = i % 2 === 1;
        return (
          <article
            key={step.number}
            className={`${styles.row} ${flip ? styles.flip : ""} ${reached ? styles.lit : ""}`}
            style={{ top: `${(y / VB.h) * 100}%` }}
          >
            <div className={styles.text}>
              <span className={`mono-label ${styles.num}`}>Station {step.number}</span>
              <h3>{step.title}</h3>
              <InlineHtml as="p" html={step.html} />
            </div>
            <span className={styles.node} aria-hidden="true">
              {step.number}
            </span>
            <div className={styles.art} aria-hidden="true">
              <Vignette n={i} />
              {i < 4 ? (
                <span className={styles.peep}>
                  <Peep size={120} fill={FILL[i] ?? "mint"} slot={`station-${i as 0 | 1 | 2 | 3}`} />
                </span>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
