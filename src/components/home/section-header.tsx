import styles from "./home.module.css";

type Props = {
  readonly label: string;
  readonly title: string;
  readonly sub?: string;
  readonly id?: string;
  /** Light text for headers that sit on an ink band. */
  readonly onDark?: boolean;
};

export function SectionHeader({ label, title, sub, id, onDark }: Props) {
  return (
    <header className={`${styles.sectionHeader} ${onDark ? styles.onDark : ""}`}>
      <span className={styles.label}>{label}</span>
      <h2 id={id} className="sec-title">
        {title}
      </h2>
      {sub ? <p className={styles.sub}>{sub}</p> : null}
    </header>
  );
}
