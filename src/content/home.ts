// Home page copy, carried over from the legacy index.html (hand-copied; the FAQ and testimonials are
// generated into home-faq.ts and testimonials.ts).
//
// TIME-SENSITIVE: `campaign` holds the claims that go stale (cohort month, number of spots). They live
// here, in one place, instead of being scattered through components. Review them before promoting this
// site; the legacy page also hard-codes them. Whether applications are open comes live from the API.

export const HOME = {
  campaign: { spots: "2500", cohortLabel: "January 2027" },
  hero: {
    badge: "Scholarship Applications Open",
    headline: ["Build Skills That", "Shape Your"],
    emphasis: "Future.",
    sub: "Africa's scholarship-first tech academy. 3 intensive months of live classes, real mentors, and career support until you land your first role. Tuition funded by a scholarship.",
    cta: "Apply Now →",
  },
  tracks: {
    label: "Curriculum",
    title: "Explore Our Career-Focused Tracks",
    sub: "Choose from expertly designed programs built around practical, real-world skills.",
    note: "No experience needed. Every track starts from the fundamentals, and all run 3 months, live in the evenings.",
    unavailable: "The track list is temporarily unavailable. You can still apply and choose your track on the form.",
  },
  process: {
    label: "The Process",
    title: "Built for Learners, Driven by Outcomes.",
    sub: "Four structured phases designed around a single goal: your first paid role in tech.",
  },
  community: {
    label: "Community",
    title: "Join Africa's Rising Tech Generation",
    sub: "Students across Nigeria and beyond building real careers, one cohort at a time.",
  },
  globalReach: {
    label: "Global Reach",
    title: "Applications From Across the Map",
    sub: "Learners apply from many countries, not just one — this updates as new applications come in.",
  },
  testimonials: {
    label: "Learner Stories",
    title: "What Our Scholars Say",
    sub: "Real feedback from students who completed programs at ProTech Rise Academy.",
  },
  whoItsFor: {
    label: "Who It's For",
    title: "Built for How You Learn",
    sub: "Live evening classes, fully online, whatever your starting point.",
  },
  faq: {
    label: "FAQ",
    title: "Frequently Asked Questions",
    sub: "Helpful information to guide your learning journey.",
    more: "Read the full FAQ",
  },
  cta: {
    title: "Start Your Learning Journey Today",
    body: "Join hundreds of learners building real-world tech skills and growing their careers with confidence.",
    openSentence: "Applications are open now.",
    button: "Apply Now →",
  },
} as const;

export type ProcessStep = { readonly number: string; readonly title: string; readonly html: string };

export const PROCESS_STEPS: readonly ProcessStep[] = [
  {
    number: "01",
    title: "Apply for a Scholarship",
    html: 'Submit your application at <a href="/apply">our scholarship portal</a>. We assess potential and commitment - no experience needed.',
  },
  {
    number: "02",
    title: "Join Live Evening Classes",
    html: "3 months of structured evening sessions with practitioners. Fits around your schedule.",
  },
  {
    number: "03",
    title: "Build Your Portfolio",
    html: "Work on real projects. Leave with proof of your skills, not just a certificate.",
  },
  {
    number: "04",
    title: "Get Career Support",
    html: "Interview coaching, employer introductions, support until you sign your first offer.",
  },
];
