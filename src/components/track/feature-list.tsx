import styles from "./feature-list.module.css";

/** A short "what's included" list. Each item is something the programme actually provides (see content/home.ts). */
export function FeatureList({
  features,
}: {
  readonly features: readonly string[];
}) {
  if (features.length === 0) return null;
  return (
    <ul className={styles.list}>
      {features.map((feature) => (
        <li key={feature} className={styles.item}>
          <span className={styles.tick} aria-hidden="true">
            ✓
          </span>
          {feature}
        </li>
      ))}
    </ul>
  );
}
