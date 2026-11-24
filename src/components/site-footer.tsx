import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/site";
import styles from "./site-footer.module.css";

type Props = {
  readonly siteName: string;
  /** Non-production builds say so; production must not. */
  readonly isDevBuild: boolean;
};

export function SiteFooter({ siteName, isDevBuild }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.note}>
          © {new Date().getFullYear()} {siteName}.{isDevBuild ? " Development build, not the live site." : ""}
        </p>
        <nav aria-label="Footer" className={styles.links}>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
