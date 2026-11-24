// A short pitch per track: what you'll learn (built from the curriculum in curricula.ts) and who the track is for.
// Static content like curricula.ts. Wording is approved by the project owner; it makes no job or salary promises.
// A track with no entry simply gets no pitch block (pitchFor returns null).

export type TrackPitch = { readonly trackSlug: string; readonly learn: string; readonly who: string };

export const TRACK_PITCHES: readonly TrackPitch[] = [
  {
    trackSlug: "frontend",
    learn: "You'll build websites from the ground up: how the web works, then HTML and CSS for layout and style, JavaScript for interactivity, and React for building interfaces from components. You'll also learn Git, testing, accessibility and performance, and finish by deploying a portfolio project.",
    who: "Beginners who like seeing their work on screen and want to learn to build modern websites. No coding experience needed.",
  },
  {
    trackSlug: "backend",
    learn: "You'll learn how the server side of an app works: JavaScript and Node.js, SQL databases, building APIs with Express, keeping users and data secure, testing, and basic caching and automated delivery. You'll finish by building and deploying your own API.",
    who: "Beginners who enjoy logic and problem-solving and want to learn how apps store data and talk to each other. No coding experience needed.",
  },
  {
    trackSlug: "cloud",
    learn: "You'll learn what the cloud is and how teams use it, with Microsoft Azure as the main platform and AWS and Google Cloud equivalents shown beside it. You'll cover identity and access, computing, networking and storage, databases, serverless, monitoring and governance, then deploy a project. It also prepares you for the Azure Fundamentals exam if you choose to sit it.",
    who: "Beginners curious about how online services are run and secured. No technical background needed.",
  },
  {
    trackSlug: "mobile",
    learn: "You'll build phone apps with Flutter and Dart, which run on both Android and iPhone from one codebase. You'll learn screens and layouts, managing app data, storing information on the device, working with online data, testing, and how to publish an app.",
    who: "Beginners who want to make apps for phones. No programming experience needed.",
  },
  {
    trackSlug: "data",
    learn: "You'll learn to turn raw data into answers: Excel, SQL, Python, cleaning messy data, basic statistics, and building reports and dashboards in Power BI. You'll finish with an analysis project you can present.",
    who: "Beginners who like numbers, patterns and finding out why things happen. No experience needed.",
  },
  {
    trackSlug: "ai-prompt",
    learn: "You'll learn how language models work and how to get reliable results from them: prompting techniques, controlling and structuring outputs, tuning settings, testing prompts, and spotting where they fail or can be misused. You'll finish with a prompt-based project.",
    who: "Beginners who want to use AI tools well, with no coding required to start.",
  },
  {
    trackSlug: "ai-auto",
    learn: "You'll learn to build AI that does tasks for you: working with APIs, how language models and embeddings work, giving a model your own documents (RAG), tools and the agent loop, memory, MCP, and safety. You'll finish by building an automation.",
    who: "Beginners who are comfortable learning new tools and want to build with AI. You'll learn the basics of the command line and Git along the way.",
  },
  {
    trackSlug: "product",
    learn: "You'll learn how products are shaped: researching users and markets, positioning, writing requirements, planning a roadmap and backlog, working with engineers using agile, measuring results and managing stakeholders. You'll finish by planning a product end to end.",
    who: "Beginners who are curious about why products get built and how teams decide what to make. No experience needed.",
  },
  {
    trackSlug: "project",
    learn: "You'll learn how projects are run from start to finish: starting with a charter and clear goals, breaking work down and scheduling it, managing cost and risk, running the work and keeping quality, and delivering with agile and Scrum. You'll finish with a capstone project.",
    who: "Beginners who are organised, like coordinating people and tasks, and want to learn a structured way to get work done.",
  },
  {
    trackSlug: "virtual",
    learn: "You'll learn the work of a remote assistant: setting up a professional workspace, managing inboxes and calendars, coordinating travel and events, organising documents with Google Workspace and Notion, tracking tasks with Asana and Trello, and finding and onboarding clients. You'll finish with a mock client project.",
    who: "Beginners who are organised, communicate clearly and want to learn to support businesses remotely.",
  },
  {
    trackSlug: "marketing",
    learn: "You'll learn how businesses reach customers online: strategy and customer research, search engine optimisation, content and social media, paid search and social ads, email marketing, and analytics. You'll finish by planning and presenting a full campaign.",
    who: "Beginners who are creative and curious about how people discover and choose products online.",
  },
  {
    trackSlug: "cyber",
    learn: "You'll build a foundation in cybersecurity: IT basics, Linux, networking, the core ideas behind security, common attacks and how they're stopped, and cloud security basics. You'll finish with a hands-on security project in a safe practice lab.",
    who: "Beginners who like understanding how systems work and how they can be protected. No experience needed.",
  },
  {
    trackSlug: "design",
    learn: "You'll learn to design digital products: understanding users, mapping flows, wireframing and prototyping in Figma, visual and interface design, testing with real people, and handing designs to developers. You'll finish with a portfolio case study.",
    who: "Beginners who are creative and enjoy making things easy and pleasant to use. No design experience needed.",
  },
];

export function pitchFor(slug: string, pitches: readonly TrackPitch[] = TRACK_PITCHES): TrackPitch | null {
  return pitches.find((p) => p.trackSlug === slug) ?? null;
}
