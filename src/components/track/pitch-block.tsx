import type { TrackPitch } from "@/content/track-pitches";
import styles from "./pitch-block.module.css";

/** The track's pitch: what you'll learn and who it's for. Renders nothing for a track with no pitch yet. */
export function PitchBlock({ pitch }: { readonly pitch: TrackPitch | null }) {
  if (!pitch) return null;
  return (
    <div className={styles.pitch}>
      <div>
        <h2 className={styles.heading}>About this track</h2>
        <p className={styles.text}>{pitch.learn}</p>
      </div>
      <div>
        <h2 className={styles.heading}>Who it&apos;s for</h2>
        <p className={styles.text}>{pitch.who}</p>
      </div>
    </div>
  );
}
