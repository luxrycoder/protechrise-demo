"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { REFUND_POLICY_UPDATED, REFUND_POLICY_VERSION } from "@/content/policy-versions";
import { SelectField, fieldAria } from "@/features/application/field-controls";
import type { StepProps } from "@/features/application/steps/step-types";
import { EXPERIENCE_LEVEL_OPTIONS } from "@/lib/api/schemas/applications";
import type { Track } from "@/lib/track-filters";
import styles from "@/features/application/application.module.css";

type FieldProps = Pick<StepProps, "values" | "errors" | "onChange" | "onBlur">;

/** Tracks grouped by category, in the catalogue order the API returns them. */
function groupByCategory(tracks: readonly Track[]): Array<{ label: string; options: string[] }> {
  const groups = new Map<string, string[]>();
  for (const track of tracks) {
    const category = track.category ?? "Tracks";
    groups.set(category, [...(groups.get(category) ?? []), track.name]);
  }
  return [...groups].map(([label, options]) => ({ label, options }));
}

/** The preferred track, shared by both application forms. */
export function TrackField({ values, errors, onChange, onBlur, tracks }: FieldProps & { readonly tracks: readonly Track[] }) {
  const hasTracks = tracks.length > 0;
  return (
    <SelectField
      id="preferredTrack"
      label="Preferred track"
      value={values.preferredTrack}
      placeholder="Select a track"
      groups={groupByCategory(tracks)}
      disabled={!hasTracks}
      error={errors.preferredTrack}
      hint={hasTracks ? undefined : "Tracks for the next cohort will be announced soon."}
      onChange={(v) => onChange("preferredTrack", v)}
      onBlur={() => onBlur("preferredTrack")}
    />
  );
}

/** Experience in the chosen track, shared by both application forms. */
export function ExperienceField({ values, errors, onChange, onBlur }: FieldProps) {
  return (
    <SelectField
      id="experienceLevel"
      label="Experience in this track"
      value={values.experienceLevel}
      placeholder="Select level"
      options={EXPERIENCE_LEVEL_OPTIONS}
      error={errors.experienceLevel}
      onChange={(v) => onChange("experienceLevel", v)}
      onBlur={() => onBlur("experienceLevel")}
    />
  );
}

/**
 * The two acceptances every applicant must give: the information is accurate, and the policies. `refundLabel` is the
 * wording of the second: the award form says "the policies", apply-and-pay names the fee that is non-refundable.
 */
export function ConsentFields({ values, errors, onToggle, refundLabel }: Pick<StepProps, "values" | "errors" | "onToggle"> & { readonly refundLabel: ReactNode }) {
  return (
    <>
      <div className={styles.consent}>
        <input id="consent" type="checkbox" checked={values.consent} onChange={(event) => onToggle("consent", event.target.checked)} {...fieldAria("consent", errors.consent, false)} />
        <div>
          <label htmlFor="consent">
            I confirm the information provided is accurate and I agree that ProTech Rise Academy may contact me about this application and related program updates.
          </label>
          {errors.consent ? (
            <p id="consent-error" className={styles.error}>
              {errors.consent}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.consent}>
        <input id="refundPolicy" type="checkbox" checked={values.refundPolicy} onChange={(event) => onToggle("refundPolicy", event.target.checked)} {...fieldAria("refundPolicy", errors.refundPolicy, false)} />
        <div>
          <label htmlFor="refundPolicy">{refundLabel}</label>
          <p className={styles.policyVersion}>
            Refund policy version {REFUND_POLICY_VERSION}, last updated {REFUND_POLICY_UPDATED}.
          </p>
          {errors.refundPolicy ? (
            <p id="refundPolicy-error" className={styles.error}>
              {errors.refundPolicy}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** The award form's wording of the policy acceptance. */
export const AwardRefundLabel = (
  <>
    I understand and accept the{" "}
    <Link href="/refund-policy" target="_blank" rel="noopener">
      policies
    </Link>
    .
  </>
);
