// DEMO CONTENT. Made-up reviews so the page can be designed and reviewed. None of these people exist. Shown only on
// non-production sites (lib/demo.ts) with a "Demo" badge, and only for tracks without enough real testimonials.

export type DemoReview = { readonly trackSlug: string; readonly quote: string; readonly name: string; readonly role: string };

export const DEMO_REVIEWS: readonly DemoReview[] = [
  { trackSlug: "backend", name: "Demo reviewer A.", role: "Backend student", quote: "The live sessions made hard ideas feel simple, and I could always ask questions." },
  { trackSlug: "backend", name: "Demo reviewer B.", role: "Backend student", quote: "Building a real API by the end gave me something I was proud to show." },
  { trackSlug: "cloud", name: "Demo reviewer C.", role: "Cloud student", quote: "The labs let me try things for myself instead of only watching." },
  { trackSlug: "cloud", name: "Demo reviewer D.", role: "Cloud student", quote: "Every new term was explained clearly before we used it." },
  { trackSlug: "mobile", name: "Demo reviewer E.", role: "Mobile student", quote: "Seeing my own app run on a phone was the best moment of the course." },
  { trackSlug: "mobile", name: "Demo reviewer F.", role: "Mobile student", quote: "The pace suited a beginner, and the tutor was patient with my questions." },
  { trackSlug: "ai-prompt", name: "Demo reviewer G.", role: "AI prompting student", quote: "I learned how to check AI answers instead of just trusting them." },
  { trackSlug: "ai-prompt", name: "Demo reviewer H.", role: "AI prompting student", quote: "Clear examples made prompting much easier to understand." },
  { trackSlug: "product", name: "Demo reviewer I.", role: "Product student", quote: "The case studies showed me how real teams make decisions." },
  { trackSlug: "product", name: "Demo reviewer J.", role: "Product student", quote: "I finally understand what a product roadmap is for." },
  { trackSlug: "project", name: "Demo reviewer K.", role: "Project management student", quote: "The templates were practical and I used them on a real task straight away." },
  { trackSlug: "project", name: "Demo reviewer L.", role: "Project management student", quote: "Breaking a big job into steps changed how I plan my work." },
  { trackSlug: "virtual", name: "Demo reviewer M.", role: "Virtual assistant student", quote: "The mock client project showed me what the work is really like." },
  { trackSlug: "virtual", name: "Demo reviewer N.", role: "Virtual assistant student", quote: "I now feel organised and confident handling inboxes and calendars." },
  { trackSlug: "cyber", name: "Demo reviewer O.", role: "Cybersecurity student", quote: "Practising in a safe lab made security feel less scary." },
  { trackSlug: "cyber", name: "Demo reviewer P.", role: "Cybersecurity student", quote: "The networking weeks gave me a solid base for everything after." },
  { trackSlug: "design", name: "Demo reviewer Q.", role: "Design student", quote: "Testing my design with real people taught me more than any tutorial." },
  { trackSlug: "design", name: "Demo reviewer R.", role: "Design student", quote: "I finished with a case study I could actually show." },
];
