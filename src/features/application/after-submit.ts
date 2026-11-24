import { thankYouUrl, type ThankYouInput } from "@/features/application/thank-you-url";

/**
 * Where to send the applicant after a successful submission. An apply-and-pay cohort returns a pay link and the
 * applicant goes straight to payment; otherwise (the award flow, or a link the contract refused) it is the thank-you page.
 */
export function destinationAfterSubmit(response: { readonly payUrl?: string | undefined }, thankYou: ThankYouInput): string {
  return response.payUrl ?? thankYouUrl(thankYou);
}
