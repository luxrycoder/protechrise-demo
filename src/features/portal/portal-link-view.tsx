"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PORTAL_LINK_LABEL, PORTAL_PATH, portalLinkVisible } from "@/features/portal/portal-link";
import { createApi } from "@/lib/api";
import styles from "@/features/status/status.module.css";

const api = createApi();

/** A link from the status page to the learner portal, shown only once the API says the portal is open for this learner. */
export function PortalLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api.portal.state().then((result) => {
      if (!cancelled) setVisible(portalLinkVisible(result));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible) return null;
  return (
    <div className={styles.block}>
      <Link className={styles.primary} href={PORTAL_PATH}>{PORTAL_LINK_LABEL}</Link>
    </div>
  );
}
