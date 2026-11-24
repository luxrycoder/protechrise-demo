import type { Metadata } from "next";
import { ClaimStart } from "@/features/claim-start/claim-start";
import { claimToken } from "@/features/claim-start/start";
import styles from "@/features/claim-start/claim-start.module.css";

export const metadata: Metadata = {
  title: "Confirm Your Place",
  description: "Confirm your course and the policies before paying.",
  robots: { index: false, follow: false },
};

// The token comes from the query string, and the fee and deadlines are live, so this renders per request.
export const dynamic = "force-dynamic";

type Props = { readonly searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ClaimStartPage({ searchParams }: Props) {
  const token = claimToken(await searchParams);
  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <ClaimStart token={token} />
      </div>
    </section>
  );
}
