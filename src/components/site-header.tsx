import Link from "next/link";
import { NAV_LINKS } from "@/lib/site";
import { MobileNav } from "./mobile-nav";
import { NavTracks } from "@/components/nav-tracks";
import { loadTracks } from "@/lib/tracks";
import styles from "./site-header.module.css";

export async function SiteHeader() {
  const tracks = (await loadTracks())?.tracks ?? [];
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="ProTech Rise Academy home">
          ProTech <span>Rise</span>
        </Link>
        <nav aria-label="Primary" className={styles.nav}>
          {NAV_LINKS.map((link) =>
            link.label === "Tracks" ? (
              <NavTracks key={link.href} label={link.label} tracks={tracks} />
            ) : (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <div className={styles.actions}>
          <Link href="/apply" className="btn btn-primary">
            Apply now
          </Link>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
