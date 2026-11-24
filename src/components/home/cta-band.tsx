import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Peep } from "@/components/art/peep";
import { HOME } from "@/content/home";
import styles from "./cta-band.module.css";

export function CtaBand({ isOpen }: { readonly isOpen: boolean }) {
  const { cta, campaign } = HOME;
  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      <div className={`container ${styles.inner}`}>
        <p className={`mono-label ${styles.kicker}`}>Next station</p>
        <h2 id="cta-title" className={styles.title}>
          {cta.title}
        </h2>
        <p className={styles.body}>{isOpen ? `${cta.body} ${cta.openSentence}` : cta.body}</p>
        <Link href="/apply" className={`btn btn-mint ${styles.button}`}>
          {cta.button.replace(/\s*→\s*$/, "")} <ArrowRight weight="bold" size={18} aria-hidden="true" />
        </Link>
        <p className={styles.note}>Scholarship-funded tuition · {campaign.spots} spots</p>
        <span className={styles.peep} aria-hidden="true">
          <Peep size={230} fill="mint" slot="cta" />
        </span>
      </div>
      <div className={styles.rail} aria-hidden="true" />
    </section>
  );
}
