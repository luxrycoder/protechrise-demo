import type { Metadata } from "next";
import { PortalApp } from "@/features/portal/portal-app";
import { loadLmsOrigin } from "@/lib/lms-origin";
import styles from "@/features/portal/portal.module.css";

export const metadata: Metadata = {
  title: "Your Portal",
  description: "Your ProTech Rise Academy learner portal.",
  robots: { index: false, follow: false },
};

// Personal and signed-in: never cached.
export const dynamic = "force-dynamic";

export default function PortalPage() {
  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <PortalApp lmsOrigin={loadLmsOrigin()} />
      </div>
    </section>
  );
}
