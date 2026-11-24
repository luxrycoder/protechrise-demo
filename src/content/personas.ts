// Copy for the "who it's for" section (#110). Every claim here repeats something the site already says (3 months,
// live evenings, fully online and recorded, no experience needed, portfolio, certificate, career support), mostly
// in the FAQ. Class times are fixed, so avoid "flexible". The owner signs off changes.

export type Persona = { readonly label: string; readonly headline: string; readonly body: string };

export const PERSONAS: readonly Persona[] = [
  {
    label: "Career changers",
    headline: "Switching into tech from another field",
    body: "No experience is needed: every track starts from the fundamentals, and you finish with a real portfolio of work to show employers.",
  },
  {
    label: "Students",
    headline: "Already studying, building skills on the side",
    body: "Live evening classes, fully online and designed to fit around your studies. Sessions are recorded too.",
  },
  {
    label: "Full-time workers",
    headline: "Evening classes fit around a full-time job",
    body: "Three months of live evening sessions with practitioners, so you can keep your job while you learn.",
  },
  {
    label: "Parents",
    headline: "Evening classes, from home",
    body: "Fully live online in the evenings, with recordings if you miss a session.",
  },
  {
    label: "First-time job seekers",
    headline: "No formal work experience yet",
    body: "Leave with a portfolio and a certificate, then get interview coaching and employer introductions until you sign your first offer.",
  },
] as const;
