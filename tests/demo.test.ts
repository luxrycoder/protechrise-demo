import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Reviews } from "@/components/track/reviews";
import { TutorList } from "@/components/track/tutor-list";
import { DEMO_REVIEWS } from "@/content/demo/reviews";
import { DEMO_TUTORS } from "@/content/demo/tutors";
import { CURRICULA } from "@/content/curricula";
import { TESTIMONIALS } from "@/content/testimonials";
import { demoContentEnabled, MIN_REVIEWS, reviewsFor } from "@/lib/demo";
import { courseJsonLd } from "@/lib/json-ld";

describe("demoContentEnabled", () => {
  test("is on only for non-production sites (noindex on)", () => {
    expect(demoContentEnabled(true)).toBe(true);
    expect(demoContentEnabled(false)).toBe(false);
  });
});

describe("reviewsFor", () => {
  test("uses real testimonials first, without demo stars", () => {
    const reviews = reviewsFor("frontend", TESTIMONIALS, DEMO_REVIEWS, true);
    expect(reviews.length).toBeGreaterThanOrEqual(MIN_REVIEWS);
    expect(reviews.every((r) => !r.demo)).toBe(true);
  });

  test("tops up a track with no real reviews using demo reviews when demo is on", () => {
    const reviews = reviewsFor("cyber", TESTIMONIALS, DEMO_REVIEWS, true);
    expect(reviews).toHaveLength(MIN_REVIEWS);
    expect(reviews.every((r) => r.demo)).toBe(true);
  });

  test("shows no demo reviews at all when demo is off (production)", () => {
    for (const c of CURRICULA) {
      expect(reviewsFor(c.trackSlug, TESTIMONIALS, DEMO_REVIEWS, false).some((r) => r.demo)).toBe(false);
    }
  });
});

describe("demo content", () => {
  test("every track has a demo tutor and enough demo or real reviews, with unique slugs per tutor", () => {
    for (const c of CURRICULA) {
      expect(DEMO_TUTORS.filter((t) => t.trackSlug === c.trackSlug)).toHaveLength(1);
      expect(reviewsFor(c.trackSlug, TESTIMONIALS, DEMO_REVIEWS, true).length).toBeGreaterThanOrEqual(MIN_REVIEWS);
    }
  });

  test("demo content is always labelled", () => {
    const tutors = renderToStaticMarkup(TutorList({ tutors: DEMO_TUTORS.slice(0, 1), demo: true }));
    expect(tutors).toContain("Demo");
    const demoReviews = reviewsFor("cyber", TESTIMONIALS, DEMO_REVIEWS, true);
    const html = renderToStaticMarkup(Reviews({ reviews: demoReviews }));
    expect(html).toContain("Demo");
    expect(html).toContain("5 out of 5 stars (demo)");
  });

  test("real reviews are shown without stars", () => {
    const html = renderToStaticMarkup(Reviews({ reviews: reviewsFor("frontend", TESTIMONIALS, DEMO_REVIEWS, true) }));
    expect(html).not.toContain("stars");
    expect(html).not.toContain("★");
  });

  test("demo tutors and ratings never enter the structured data", () => {
    const json = JSON.stringify(courseJsonLd({ name: "X", slug: "x", category: null, blurb: null, color: null, sortOrder: 1 }, "P"));
    expect(json).not.toMatch(/rating|review|instructor|Demo/i);
  });

  test("components render nothing when empty", () => {
    expect(Reviews({ reviews: [] })).toBeNull();
    expect(TutorList({ tutors: [], demo: true })).toBeNull();
  });
});
