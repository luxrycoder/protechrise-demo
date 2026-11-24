import type { Metadata } from "next";
import { paymentReference } from "@/features/claim-confirmed/confirmed";
import { PaymentStatus } from "@/features/claim-confirmed/payment-status";
import styles from "@/features/claim-confirmed/claim-confirmed.module.css";

export const metadata: Metadata = {
  title: "Payment Confirmation",
  description: "Your ProTech Rise Academy scholarship commitment fee payment confirmation.",
  robots: { index: false, follow: false },
};

// Reads the payment reference from the query string, so it renders per request.
export const dynamic = "force-dynamic";

type Props = { readonly searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ClaimConfirmedPage({ searchParams }: Props) {
  const reference = paymentReference(await searchParams);
  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <PaymentStatus reference={reference} />
      </div>
    </section>
  );
}
