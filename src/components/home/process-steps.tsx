import { InlineHtml } from "@/components/inline-html";
import { PROCESS_STEPS } from "@/content/home";
import styles from "./home.module.css";

export function ProcessSteps() {
  return (
    <ol className={styles.steps}>
      {PROCESS_STEPS.map((step) => (
        <li key={step.number} className={styles.step}>
          <span className={styles.stepNumber} aria-hidden="true">
            {step.number}
          </span>
          <h3 className={styles.stepTitle}>{step.title}</h3>
          <InlineHtml as="p" html={step.html} className={styles.stepBody} />
        </li>
      ))}
    </ol>
  );
}
