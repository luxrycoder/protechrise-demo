import styles from "./demo-badge.module.css";

/** Marks made-up content so nobody mistakes it for real. Shown wherever demo content is. */
export function DemoBadge() {
  return <span className={styles.badge}>Demo</span>;
}
