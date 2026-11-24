"use client";

import { useState } from "react";
import { Peep } from "@/components/art/peep";
import { PERSONAS } from "@/content/personas";
import styles from "./who-its-for.module.css";

const FILLS = ["mint", "blue", "sand", "purple", "orange"] as const;

/** Pick who you are; the answer (the owner-approved persona copy) and a matching illustration swap in. */
export function WhoItsFor() {
  const [i, setI] = useState(0);
  const persona = PERSONAS[i] ?? PERSONAS[0];
  if (!persona) return null;
  return (
    <div className={styles.wrap}>
      <ul className={styles.tabs} role="tablist" aria-label="Who the programme is for" aria-orientation="vertical">
        {PERSONAS.map((p, n) => (
          <li key={p.label} role="presentation">
            <button type="button" role="tab" className={styles.tab} aria-selected={n === i} aria-controls="persona-panel" id={`persona-tab-${n}`} onClick={() => setI(n)}>
              <span className={styles.dot} aria-hidden="true" />
              {p.label}
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.stage} id="persona-panel" role="tabpanel" aria-labelledby={`persona-tab-${i}`}>
        <div key={i} className={styles.body}>
          <p className={`mono-label ${styles.kicker}`}>{persona.label}</p>
          <h3 className={styles.headline}>{persona.headline}</h3>
          <p className={styles.text}>{persona.body}</p>
        </div>
        <span className={styles.peep} aria-hidden="true">
          <Peep size={190} fill={FILLS[i % FILLS.length]} slot={`persona-${(i % 5) as 0 | 1 | 2 | 3 | 4}`} />
        </span>
      </div>
    </div>
  );
}
