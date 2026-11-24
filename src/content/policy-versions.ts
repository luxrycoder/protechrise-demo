import { REFUND_BLOCKS } from "@/content/refund-policy";
import { parseVersionLine } from "@/lib/policy-version";

const refund = parseVersionLine(REFUND_BLOCKS);
if (!refund) throw new Error("The refund policy page must start with a 'Version … · Last updated …' line");

/** The version of the refund policy shown on /refund-policy, which is what an applicant accepts on the form. */
export const REFUND_POLICY_VERSION = refund.version;
export const REFUND_POLICY_UPDATED = refund.updated;
