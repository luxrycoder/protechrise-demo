import type { Tutor } from "@/content/demo/tutors";
import { initialsOf } from "@/lib/track-filters";
import { DemoBadge } from "./demo-badge";
import styles from "./tutor-list.module.css";

/** The track's tutors. `demo` marks made-up tutors with a badge. Renders nothing when there are none. */
export function TutorList({ tutors, demo }: { readonly tutors: readonly Tutor[]; readonly demo: boolean }) {
  if (tutors.length === 0) return null;
  return (
    <ul className={styles.list}>
      {tutors.map((tutor) => (
        <li key={tutor.name} className={styles.tutor}>
          <span className={styles.avatar} aria-hidden="true">
            {initialsOf(tutor.name)}
          </span>
          <div>
            <p className={styles.name}>
              {tutor.name} {demo ? <DemoBadge /> : null}
            </p>
            <p className={styles.role}>{tutor.role}</p>
            <p className={styles.bio}>{tutor.bio}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
