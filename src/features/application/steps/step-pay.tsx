"use client";

import Link from "next/link";
import { APPLY_PAY } from "@/content/apply-pay";
import { StepAbout } from "@/features/application/steps/step-about";
import { ConsentFields, ExperienceField, TrackField } from "@/features/application/steps/shared-fields";
import type { StepProps } from "@/features/application/steps/step-types";
import { fillTokens, type PublicTerms } from "@/lib/fee";
import type { Track } from "@/lib/track-filters";
import styles from "@/features/application/application.module.css";

type Props = StepProps & { readonly tracks: readonly Track[]; readonly terms: PublicTerms };

/** The one-screen apply-and-pay form: contact details, track and experience, and the two acceptances. */
export function StepPay({ terms, tracks, ...props }: Props) {
  const refundLabel = (
    <>
      I accept the{" "}
      <Link href="/refund-policy" target="_blank" rel="noopener">
        refund policy
      </Link>
      : {fillTokens(APPLY_PAY.refundAcceptance, terms)}
    </>
  );
  return (
    <>
      <StepAbout {...props} withCity={false} />
      <div className={`${styles.grid} ${styles.afterGrid}`}>
        <TrackField {...props} tracks={tracks} />
        <ExperienceField {...props} />
      </div>
      <ConsentFields values={props.values} errors={props.errors} onToggle={props.onToggle} refundLabel={refundLabel} />
    </>
  );
}
