import type { Metadata } from "next";
import { StatusPortal } from "@/features/status/status-portal";
import { loadLmsOrigin } from "@/lib/lms-origin";
import styles from "@/features/status/status.module.css";

export const metadata: Metadata = {
  title: "Check Application Status",
  description: "Check the status of your ProTech Rise Academy scholarship application.",
  robots: { index: false, follow: false },
};

// Personal and signed-in: never cached, and the query string (expired, next) is read per request.
export const dynamic = "force-dynamic";

type Props = { readonly searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (value: string | string[] | undefined): string | undefined => (typeof value === "string" ? value : undefined);

export default async function StatusPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <StatusPortal expired={first(params.expired)} next={first(params.next)} lmsOrigin={loadLmsOrigin()} />
      </div>
    </section>
  );
}
