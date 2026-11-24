"use client";

import { SelectField, TextField } from "@/features/application/field-controls";
import { AwardRefundLabel, ConsentFields } from "@/features/application/steps/shared-fields";
import type { StepProps } from "@/features/application/steps/step-types";
import { REFERRAL_SOURCE_OPTIONS } from "@/lib/api/schemas/applications";
import { fillFeeToken } from "@/lib/fee";
import styles from "@/features/application/application.module.css";

type Props = StepProps & {
  /** The live onboarding fee like "₦19,500", or null when unavailable. */
  readonly fee: string | null;
};

/**
 * The answer is stored in the API's `canSelfFund` field, whose name is the opposite of the question: the question
 * is "Do you need scholarship support?", so `Yes` means they need it (staff see it labelled "Needs scholarship
 * support"). Do not "fix" the values.
 */
const SUPPORT_OPTIONS = [
  { value: "Yes", label: "Yes, I need scholarship support" },
  { value: "No", label: "No, I can fund this myself" },
] as const;

/** Step 3: scholarship context and consent. */
export function StepScholarship({ values, errors, onChange, onToggle, onBlur, fee }: Props) {
  return (
    <>
      <div className={styles.grid}>
        <SelectField
          id="canSelfFund"
          label="Do you need scholarship support?"
          value={values.canSelfFund}
          placeholder="Select an answer"
          options={SUPPORT_OPTIONS}
          hint={fillFeeToken("A {{ONBOARDING_FEE}} onboarding/certification fee is required.", fee)}
          error={errors.canSelfFund}
          full
          onChange={(v) => onChange("canSelfFund", v)}
          onBlur={() => onBlur("canSelfFund")}
        />
        <SelectField id="referralSource" label="How did you hear about ProTech Rise Academy?" value={values.referralSource} placeholder="Select an option" options={REFERRAL_SOURCE_OPTIONS} error={errors.referralSource} full onChange={(v) => onChange("referralSource", v)} onBlur={() => onBlur("referralSource")} />
        {values.referralSource === "Other" ? (
          <TextField id="referralSourceOther" label="Tell us how you heard about us" value={values.referralSourceOther} maxLength={100} full error={errors.referralSourceOther} onChange={(v) => onChange("referralSourceOther", v)} onBlur={() => onBlur("referralSourceOther")} />
        ) : null}
      </div>

      <ConsentFields {...{ values, errors, onToggle }} refundLabel={AwardRefundLabel} />
    </>
  );
}
