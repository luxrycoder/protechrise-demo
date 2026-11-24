"use client";

import { SelectField, TextAreaField } from "@/features/application/field-controls";
import { ExperienceField, TrackField } from "@/features/application/steps/shared-fields";
import type { StepProps } from "@/features/application/steps/step-types";
import { FIELD_LIMITS, CURRENT_STATUS_OPTIONS, MIN_LENGTHS, WEEKLY_HOURS_OPTIONS } from "@/lib/api/schemas/applications";
import type { Track } from "@/lib/track-filters";
import styles from "@/features/application/application.module.css";

type Props = StepProps & { readonly tracks: readonly Track[] };

/** Step 2: background, track, commitment and goals. */
export function StepBackground({ values, errors, onChange, onBlur, tracks }: Props) {
  return (
    <>
      <p className={styles.groupLabel}>Background</p>
      <div className={styles.grid}>
        <SelectField id="currentStatus" label="Current status" value={values.currentStatus} placeholder="Select status" options={CURRENT_STATUS_OPTIONS} error={errors.currentStatus} onChange={(v) => onChange("currentStatus", v)} onBlur={() => onBlur("currentStatus")} />
        <TrackField {...{ values, errors, onChange, onBlur, tracks }} />
      </div>

      <p className={styles.groupLabel}>Commitment &amp; Goals</p>
      <div className={styles.grid}>
        <ExperienceField {...{ values, errors, onChange, onBlur }} />
        <SelectField id="weeklyHours" label="Weekly hours you can commit" value={values.weeklyHours} placeholder="Select a range" options={WEEKLY_HOURS_OPTIONS} error={errors.weeklyHours} onChange={(v) => onChange("weeklyHours", v)} onBlur={() => onBlur("weeklyHours")} />

        <TextAreaField
          id="motivationEssay"
          label="Why do you deserve this scholarship?"
          value={values.motivationEssay}
          min={MIN_LENGTHS.motivationEssay}
          max={FIELD_LIMITS.motivationEssay}
          hint="Minimum 120 characters. Tell us your goal, your current challenge, and how this program will help."
          reassure="There's no perfect answer here, we read every application individually."
          error={errors.motivationEssay}
          onChange={(v) => onChange("motivationEssay", v)}
          onBlur={() => onBlur("motivationEssay")}
        />
        <TextAreaField
          id="careerGoal"
          label="Where do you want to be, 6 months after completing this program?"
          value={values.careerGoal}
          min={MIN_LENGTHS.careerGoal}
          max={FIELD_LIMITS.careerGoal}
          hint="Minimum 20 characters."
          reassure="There's no wrong answer here. We're looking for direction, not certainty."
          error={errors.careerGoal}
          onChange={(v) => onChange("careerGoal", v)}
          onBlur={() => onBlur("careerGoal")}
        />
        <TextAreaField
          id="commitmentPlan"
          label="How do you plan to stay committed to this program until completion?"
          value={values.commitmentPlan}
          min={MIN_LENGTHS.commitmentPlan}
          max={FIELD_LIMITS.commitmentPlan}
          hint="Minimum 60 characters. Think about your schedule, potential obstacles, and how you'll work around them."
          reassure="Be honest about your constraints. We'd rather plan around them with you than have you promise more than you can give."
          error={errors.commitmentPlan}
          onChange={(v) => onChange("commitmentPlan", v)}
          onBlur={() => onBlur("commitmentPlan")}
        />
      </div>
    </>
  );
}
