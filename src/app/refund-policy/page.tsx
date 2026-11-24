import type { Metadata } from "next";
import { PolicyBlocks } from "@/components/policy-blocks";
import { REFUND_BLOCKS } from "@/content/refund-policy";
import { loadPublicTerms } from "@/lib/fee";
import styles from "@/components/prose.module.css";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "The certificate fee is non-refundable once paid. What it covers and the one exception.",
};

// The amounts are live server settings, so this page renders per request (the API call itself is cached 60s).
export const dynamic = "force-dynamic";

export default async function RefundPolicyPage() {
  const terms = await loadPublicTerms();
  return (
    <section className={styles.page}>
      <div className={`container ${styles.narrow} ${styles.prose}`}>
        <PolicyBlocks blocks={REFUND_BLOCKS} terms={terms} />
      </div>
    </section>
  );
}
