import type { Metadata } from "next";
import { PolicyBlocks } from "@/components/policy-blocks";
import { PRIVACY_BLOCKS } from "@/content/privacy";
import styles from "@/components/prose.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal data ProTech Rise Academy collects, why, and what you can do about it.",
};

export default function PrivacyPage() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.narrow} ${styles.prose}`}>
        <PolicyBlocks blocks={PRIVACY_BLOCKS} />
      </div>
    </section>
  );
}
