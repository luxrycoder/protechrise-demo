// The apply-and-pay application page's copy, carried over verbatim from the legacy application.html (Cohort 2).
// {{ONBOARDING_FEE}}, {{TUITION_FEE}} and {{SCHOLARSHIP_PERCENT}} are filled per request from the API (see lib/fee.ts).
export const APPLY_PAY = {
  eyebrow: "Cohort 2 Tech Bootcamp · Apply & Pay",
  title: "Get {{SCHOLARSHIP_PERCENT}}% Scholarship on Your Tech Bootcamp",
  sub: "Join the ProTech Rise Cohort 2 Tech Bootcamp and enjoy a {{SCHOLARSHIP_PERCENT}}% scholarship on tuition fees. Instead of paying the full {{TUITION_FEE}} tuition fee, you only pay {{ONBOARDING_FEE}} for your certificate, which is issued on successful completion of the bootcamp.",
  byline: "ProTech Rise Academy · fill in the form and pay in one go",
  priceSummary: "Instead of paying the full {{TUITION_FEE}} tuition fee, you only pay <strong>{{ONBOARDING_FEE}}</strong> for your certificate, issued on successful completion of the bootcamp.",
  priceTopNote: "Fill in the form below, then pay to secure your Cohort 2 spot.",
  priceBottomNote: "Paid now to secure your Cohort 2 spot. Covers your certificate, issued on successful completion. Non-refundable once paid. Secure checkout by Paystack.",
  scholarshipBadge: "{{SCHOLARSHIP_PERCENT}}% scholarship",
  refundAcceptance: "the {{ONBOARDING_FEE}} certificate fee is non-refundable once paid, except for excess payment.",
} as const;
