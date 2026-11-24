import { STEP_NAMES, stepsFor, type StepNumber } from "@/features/application/fields";
import styles from "./application.module.css";

type Props = {
  readonly step: StepNumber;
  /** The furthest step reached, so the dots can only go back and forward over visited steps. */
  readonly maxStep: StepNumber;
  readonly onGoto: (step: StepNumber) => void;
};

/** The award application's progress bar and step buttons. (The apply-and-pay form is a single step and has none.) */
export function StepProgress({ step: current, maxStep, onGoto }: Props) {
  const steps = stepsFor("award");
  const total = steps.length;
  return (
    <div className={styles.progress}>
      <div className={styles.track} aria-hidden="true">
        <div className={styles.fill} style={{ transform: `scaleX(${(current - 1) / (total - 1)})` }} />
      </div>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step}>
            <button
              type="button"
              className={[styles.stepButton, step === current ? styles.stepActive : "", step < current ? styles.stepDone : ""].join(" ")}
              disabled={step > maxStep}
              aria-current={step === current ? "step" : undefined}
              onClick={() => onGoto(step)}
            >
              <span className={styles.stepNumber}>{step}</span>
              <span className={styles.stepLabelText}>{STEP_NAMES[step - 1]}</span>
              <span className="sr-only">{`Go to step ${step}: ${STEP_NAMES[step - 1]}`}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className={styles.stepCaption} aria-live="polite">
        Step {current} of {total} · {STEP_NAMES[current - 1]}
      </p>
    </div>
  );
}
