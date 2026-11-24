import { Peep } from "@/components/art/peep";
import styles from "./community.module.css";

const FILLS = ["mint", "sand", "blue", "orange", "purple", "mint"] as const;

/** A crowd waiting on the platform: pure illustration, so it claims nothing the data can't back. */
export function Community() {
  return (
    <div className={styles.crowd} aria-hidden="true">
      <ul>
        {FILLS.map((fill, i) => (
          <li key={i} style={{ "--i": i } as React.CSSProperties}>
            <Peep size={150} fill={fill} slot={`crowd-${i as 0 | 1 | 2 | 3 | 4 | 5}`} />
          </li>
        ))}
      </ul>
      <div className={styles.platform} />
    </div>
  );
}
