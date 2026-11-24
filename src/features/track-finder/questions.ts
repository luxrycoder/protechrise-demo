import type { FinderQuestion } from "./types";

// Quiz questions. Only "interest" narrows the list: every track is beginner-friendly and runs in the evenings, so
// "experience" and "evenings" only shape the note shown with the results, using facts the site already states.

export const INTEREST_QUESTION_ID = "interest";
export const EVENINGS_QUESTION_ID = "evenings";
/** Interest answer for people who cannot pick yet: no narrowing, the whole list is shown. */
export const UNSURE_VALUE = "unsure";

export const QUESTIONS: readonly FinderQuestion[] = [
  {
    id: "experience",
    prompt: "How much experience do you have with tech?",
    options: [
      { value: "none", label: "None yet" },
      { value: "some", label: "Some, I've dabbled" },
      { value: "lots", label: "A lot, I want to go deeper" },
    ],
  },
  {
    id: INTEREST_QUESTION_ID,
    prompt: "What sounds most interesting to you?",
    options: [
      { value: "products", label: "Building and managing products" },
      { value: "code", label: "Writing code" },
      { value: "data", label: "Data and numbers" },
      { value: "ai", label: "AI and automation" },
      { value: "design", label: "Design" },
      { value: "security", label: "Security" },
      { value: "marketing", label: "Marketing" },
      { value: "admin", label: "Organising work and admin" },
      { value: UNSURE_VALUE, label: "I'm not sure yet" },
    ],
  },
  {
    id: EVENINGS_QUESTION_ID,
    prompt: "Can you join live classes in the evenings (6PM/7:30PM WAT)?",
    options: [
      { value: "yes", label: "Yes, evenings work for me" },
      { value: "no", label: "Not always, evenings are hard for me" },
    ],
  },
];
