import styles from "./quick-facts.module.css";

export type QuickFact = { readonly label: string; readonly value: string };

/**
 * The track's key facts as one bordered strip, so they read as a row at a glance. Items share the row and wrap
 * on narrow screens; each grows to fill its line, so a wrapped last line never leaves a gap.
 */
export function QuickFacts({
  facts,
}: {
  readonly facts: readonly QuickFact[];
}) {
  if (facts.length === 0) return null;
  return (
    <dl className={styles.facts}>
      {facts.map((fact) => (
        <div key={fact.label} className={styles.fact}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
