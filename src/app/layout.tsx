import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ArtSwitcher } from "@/components/art/art-switcher";
import { WhatsappButton } from "@/components/whatsapp-button";
import { demoDataEnabled } from "@/lib/demo-data";
import { loadSiteConfig } from "@/lib/site-config";
import "./globals.css";

// Provisional fonts until the rebrand is decided; swapping is a one-line change here.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
// Mono face for station labels, weeks and the departures board only; never for sentences.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

// Metadata and the dev labels depend on runtime settings (SITE_URL, DEV_NOINDEX), so every page
// renders per request. A prerendered page would bake in the build-time values and keep dev
// labels and the wrong canonical host after promotion.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const { siteUrl, siteName, isDevBuild } = loadSiteConfig();
  const label = isDevBuild ? `${siteName} (dev)` : siteName;
  const description = "Scholarship-first, career-focused online tech training for learners across Africa.";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: label, template: `%s | ${label}` },
    description,
    // "./" resolves to each page's own path against metadataBase, giving every page its own canonical URL.
    alternates: { canonical: "./" },
    openGraph: { type: "website", siteName, locale: "en_NG", title: label, description, url: "./" },
    twitter: { card: "summary_large_image", title: label, description },
    // No `robots` meta on purpose: indexing is controlled by the X-Robots-Tag header in src/proxy.ts
    // (DEV_NOINDEX) and by robots.txt, both read at runtime.
  };
}

export const viewport: Viewport = { themeColor: "#047857" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { isDevBuild, siteName } = loadSiteConfig();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter siteName={siteName} isDevBuild={isDevBuild} />
        <WhatsappButton />
        {demoDataEnabled() ? <ArtSwitcher /> : null}
      </body>
    </html>
  );
}
