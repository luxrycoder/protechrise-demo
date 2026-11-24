import type { Review } from "@/lib/demo";
import { DemoBadge } from "./demo-badge";
import styles from "./reviews.module.css";

/**
 * Student reviews. Real ones are quotes with a link to their source and no stars. Demo ones carry a "Demo" badge and
 * a 5-star mark. Renders nothing when there are none.
 */
export function Reviews({ reviews }: { readonly reviews: readonly Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <ul className={styles.list}>
      {reviews.map((review) => (
        <li key={`${review.name}-${review.quote}`} className={styles.item}>
          <figure className={styles.figure}>
            {review.demo ? (
              <p className={styles.stars} role="img" aria-label="5 out of 5 stars (demo)">
                ★★★★★
              </p>
            ) : null}
            <blockquote className={styles.quote}>“{review.quote}”</blockquote>
            <figcaption className={styles.who}>
              <span className={styles.name}>{review.name}</span>
              <span className={styles.role}>{review.role}</span>
              {review.demo ? <DemoBadge /> : null}
              {review.source ? (
                <a href={review.source.url} className={styles.link} rel="noopener noreferrer" target="_blank">
                  View post
                </a>
              ) : null}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
