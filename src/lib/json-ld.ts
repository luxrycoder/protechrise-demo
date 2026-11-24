import type { FaqItem } from "@/content/types";
import { fillTokens, type PublicTerms } from "@/lib/fee";
import { stripInlineHtml } from "@/lib/inline-html";
import type { Track } from "@/lib/track-filters";

export function faqJsonLd(items: readonly FaqItem[], terms: PublicTerms) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: fillTokens(item.question, terms),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripInlineHtml(fillTokens(item.answer.join(" "), terms)),
      },
    })),
  };
}

export function organizationJsonLd(siteUrl: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name,
    url: siteUrl,
    description: "Scholarship-first, career-focused online tech training for learners across Africa.",
  };
}

export function websiteJsonLd(siteUrl: string, name: string) {
  return { "@context": "https://schema.org", "@type": "WebSite", name, url: siteUrl };
}

export type Breadcrumb = { readonly name: string; readonly url: string };

export function breadcrumbJsonLd(crumbs: readonly Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/** schema.org Course for a track. Facts come from the programme copy: online, three months. */
export function courseJsonLd(track: Track, providerName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: track.name,
    ...(track.blurb ? { description: track.blurb } : {}),
    courseMode: "Online",
    timeRequired: "P3M",
    provider: { "@type": "Organization", name: providerName },
  };
}

/** JSON for a <script type="application/ld+json"> tag; "<" is escaped so content can never close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
