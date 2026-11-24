// DEMO CONTENT. Made-up tutors so the page can be designed and reviewed. None of these people exist. Shown only on
// non-production sites (lib/demo.ts) with a "Demo" badge; replace with real tutors, then remove this file.

export type Tutor = {
  readonly trackSlug: string;
  readonly name: string;
  readonly role: string;
  readonly bio: string;
};

export const DEMO_TUTORS: readonly Tutor[] = [
  { trackSlug: "frontend", name: "Ada O.", role: "Frontend tutor", bio: "Teaches HTML, CSS and JavaScript to first-time coders, one small project at a time." },
  { trackSlug: "backend", name: "Tunde B.", role: "Backend tutor", bio: "Teaches servers, databases and APIs with plenty of live coding and questions." },
  { trackSlug: "cloud", name: "Ngozi E.", role: "Cloud tutor", bio: "Explains cloud ideas in plain words and walks students through hands-on labs." },
  { trackSlug: "mobile", name: "Emeka N.", role: "Mobile tutor", bio: "Guides students from their first screen to a finished app on their own phone." },
  { trackSlug: "data", name: "Zainab M.", role: "Data tutor", bio: "Teaches spreadsheets, SQL and dashboards using everyday, relatable data." },
  { trackSlug: "ai-prompt", name: "Kelechi A.", role: "AI prompting tutor", bio: "Shows students how to get dependable results from AI tools and check them." },
  { trackSlug: "ai-auto", name: "Folake S.", role: "AI automation tutor", bio: "Helps students build small AI helpers and understand how they work." },
  { trackSlug: "product", name: "Ifeanyi C.", role: "Product tutor", bio: "Teaches how teams decide what to build, using real product case studies." },
  { trackSlug: "project", name: "Halima Y.", role: "Project management tutor", bio: "Teaches planning, scheduling and teamwork with practical templates." },
  { trackSlug: "virtual", name: "Bisi T.", role: "Virtual assistant tutor", bio: "Teaches the day-to-day skills of supporting a business from anywhere." },
  { trackSlug: "marketing", name: "Obinna L.", role: "Marketing tutor", bio: "Teaches how to reach and keep customers online, with live campaign practice." },
  { trackSlug: "cyber", name: "Amara D.", role: "Cybersecurity tutor", bio: "Teaches how systems are attacked and defended in a safe practice lab." },
  { trackSlug: "design", name: "Yusuf K.", role: "Design tutor", bio: "Teaches design from first sketch to a tested prototype in Figma." },
];
