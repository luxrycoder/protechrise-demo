import type { CurriculumModule } from "@/content/curricula";
import styles from "./curriculum-list.module.css";

/**
 * A track's modules as a list. A module with a summary or topics expands (a plain <details>, no accordion library); one
 * with neither is just a titled row, so nothing offers to expand into nothing.
 */
export function CurriculumList({ modules }: { readonly modules: readonly CurriculumModule[] }) {
  return (
    <ol className={styles.list}>
      {modules.map((module, index) => (
        <li key={module.title} className={styles.item}>
          {module.summary || module.topics?.length ? (
            <details className={styles.details}>
              <summary className={styles.summary}>
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.heading}>
                  <span className={styles.title}>{module.title}</span>
                  {module.duration ? <span className={styles.duration}>{module.duration}</span> : null}
                </span>
              </summary>
              {module.summary ? <p className={styles.body}>{module.summary}</p> : null}
              {module.topics?.length ? (
                <ul className={styles.topics}>
                  {module.topics.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              ) : null}
            </details>
          ) : (
            <div className={styles.summary}>
              <span className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.heading}>
                <span className={styles.title}>{module.title}</span>
                {module.duration ? <span className={styles.duration}>{module.duration}</span> : null}
              </span>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
