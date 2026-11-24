// What each track covers, module by module. Static content, like testimonials.ts and home-faq.ts: it changes
// rarely, so it needs no API field.
//
// Entries are added only from content the project owner has approved, because a made-up syllabus would be a
// false promise to applicants. A track with no entry simply gets no "What you'll learn" section (curriculumFor
// returns null), so adding an entry is all it takes to turn it on:
//
//   { trackSlug: "frontend", modules: [{ title: "HTML & CSS foundations", duration: "Weeks 1-2", summary: "..." }, ...] },
//
// `trackSlug` must match the slug the API returns for the track.

// `duration` is free text for when in the 12 weeks the module runs, e.g. "Weeks 1-2".
// `topics` lists what the module covers, shown when it is expanded.
export type CurriculumModule = {
  readonly title: string;
  readonly summary?: string;
  readonly duration?: string;
  readonly topics?: readonly string[];
};
export type Curriculum = { readonly trackSlug: string; readonly modules: readonly CurriculumModule[] };

export const CURRICULA: readonly Curriculum[] = [
  {
    trackSlug: "frontend",
    modules: [
      { title: "Internet, HTML and CSS", duration: "Weeks 1-2", summary: "How the web works, then building and styling pages.", topics: ["How the internet, HTTP, domains, DNS and hosting work", "How browsers load a page", "Semantic HTML, forms and links", "CSS: selectors, the box model, flexbox, grid, responsive layout", "A CSS framework (Tailwind)"] },
      { title: "JavaScript", duration: "Weeks 3-5", summary: "The language that makes pages interactive.", topics: ["Variables, types, control flow and functions", "Arrays, objects and modern syntax", "The DOM and events", "Asynchronous code: promises and async/await", "Fetching data from an API", "Introduction to TypeScript"] },
      { title: "Git and package managers", duration: "Week 6", summary: "Saving, sharing and organising your code.", topics: ["Git basics: commits, branches, merging", "GitHub and pull requests", "Package managers and a build tool (Vite)"] },
      { title: "A framework: React", duration: "Weeks 7-9", summary: "Building interfaces from components.", topics: ["Components, props and state", "Hooks and handling events", "Lists, forms and routing", "Calling APIs from components"] },
      { title: "Web APIs and basic testing", duration: "Week 10", summary: "Working with browser features and checking your code.", topics: ["Browser storage and other web APIs", "Unit tests with Vitest", "Linting and formatting"] },
      { title: "Accessibility and performance", duration: "Week 11", summary: "Making sites usable by everyone, and fast.", topics: ["Accessible HTML and keyboard use", "Screen-reader basics", "Measuring speed with browser DevTools and Lighthouse", "Common web security risks (OWASP)"] },
      { title: "Deploy a portfolio project", duration: "Week 12", summary: "Ship something real.", topics: ["Planning and building a portfolio site", "Deploying it online", "Presenting your work"] },
    ],
  },
  {
    trackSlug: "backend",
    modules: [
      { title: "JavaScript, Node.js and Git", duration: "Weeks 1-2", summary: "The language and tools for server code.", topics: ["JavaScript refresher and Node.js basics", "Modules, the file system and environment variables", "Git and GitHub basics"] },
      { title: "SQL and relational databases", duration: "Weeks 3-4", summary: "Storing and querying data.", topics: ["Tables, keys and relationships", "SQL queries, joins and aggregates", "Transactions and indexes", "PostgreSQL in practice"] },
      { title: "Express and building APIs", duration: "Weeks 5-6", summary: "Serving data over HTTP.", topics: ["HTTP, status codes and REST design", "Routes, middleware and error handling", "Validating input", "Documenting an API (OpenAPI)"] },
      { title: "Authentication and basic security", duration: "Week 7", summary: "Keeping users and data safe.", topics: ["Passwords, hashing and sessions", "Tokens (JWT) and authorization", "Common web attacks and how to prevent them"] },
      { title: "Testing", duration: "Week 8", summary: "Proving your code works.", topics: ["Unit tests", "Integration tests of API routes"] },
      { title: "Caching and basic CI/CD", duration: "Week 9", summary: "Faster responses and automated delivery.", topics: ["Caching basics", "Automated tests and builds on every push"] },
      { title: "Deployed API project", duration: "Weeks 10-12", summary: "Build and ship an API.", topics: ["Designing the project", "Building with a database and authentication", "Deploying and demonstrating it"] },
    ],
  },
  {
    trackSlug: "cloud",
    modules: [
      { title: "Cloud concepts, with AWS and Google Cloud equivalents", duration: "Weeks 1-2", summary: "What the cloud is and why teams use it.", topics: ["Public, private and hybrid cloud", "Shared responsibility model", "IaaS, PaaS, SaaS and serverless", "Benefits: scalability, availability, reliability, security", "Consumption-based pricing", "Azure, AWS and Google Cloud terms side by side"] },
      { title: "Identity and access", duration: "Weeks 3-4", summary: "Who can do what.", topics: ["Directory services (Microsoft Entra ID)", "Single sign-on and multifactor authentication", "Role-based access control", "Zero Trust and defence in depth"] },
      { title: "Compute, networking and storage", duration: "Weeks 5-6", summary: "Core building blocks.", topics: ["Regions, availability zones, resource groups and subscriptions", "Virtual machines, containers and functions", "Virtual networks, subnets, DNS and VPN", "Storage services, tiers and redundancy"] },
      { title: "Databases", duration: "Week 7", summary: "Managed data services.", topics: ["Relational and non-relational options", "Choosing a managed database", "Backups and moving data to the cloud"] },
      { title: "Serverless", duration: "Week 8", summary: "Running code without managing servers.", topics: ["Functions and event-driven design", "When serverless fits and when it does not"] },
      { title: "Monitoring and governance", duration: "Week 9", summary: "Keeping cost, rules and health under control.", topics: ["Cost factors, the pricing calculator and tags", "Azure Policy and resource locks", "Azure Monitor, Service Health and Advisor", "Portal, Cloud Shell, CLI and infrastructure as code"] },
      { title: "Deployed cloud project", duration: "Weeks 10-12", summary: "Build and run something in the cloud.", topics: ["Designing the architecture", "Deploying and securing it", "Reviewing cost and monitoring", "Optional: prepare for the AZ-900 exam"] },
    ],
  },
  {
    trackSlug: "mobile",
    modules: [
      { title: "Dart basics and your development environment", duration: "Weeks 1-2", summary: "The language and tools.", topics: ["Setting up Flutter and an emulator", "Variables, types, control flow and functions", "Object-oriented Dart, async/await"] },
      { title: "Flutter widgets and layouts", duration: "Weeks 3-4", summary: "Building screens.", topics: ["Stateless and stateful widgets", "Layout widgets, styling and responsive design", "Navigation between screens"] },
      { title: "Assets, Git and design principles", duration: "Week 5", summary: "Organising a real app.", topics: ["Images, fonts and other assets", "Git and GitHub", "Basic design principles and code structure"] },
      { title: "State management", duration: "Week 6", summary: "Sharing data across the app.", topics: ["Why state management matters", "Provider or Riverpod basics"] },
      { title: "Storing data on the device", duration: "Week 7", summary: "Remembering things.", topics: ["Shared preferences", "Local database (SQLite)", "Introduction to Firebase"] },
      { title: "Working with APIs", duration: "Week 8", summary: "Online data.", topics: ["HTTP requests", "Reading JSON into your own types", "Loading and error states"] },
      { title: "Testing and dev tools", duration: "Week 9", summary: "Finding and fixing bugs.", topics: ["Widget and integration tests", "Flutter Inspector and debugging"] },
      { title: "A published app", duration: "Weeks 10-12", summary: "Ship it.", topics: ["Planning and building the app", "Preparing a release build", "Publishing to an app store"] },
    ],
  },
  {
    trackSlug: "data",
    modules: [
      { title: "Excel and data basics", duration: "Weeks 1-2", summary: "What data work is, and spreadsheets.", topics: ["What data analytics is and its four types", "Key data concepts", "Excel formulas, tables and pivot tables"] },
      { title: "SQL", duration: "Weeks 3-4", summary: "Asking databases questions.", topics: ["SELECT, filters, sorting", "Joins and aggregates", "Subqueries"] },
      { title: "Python and data libraries", duration: "Weeks 5-6", summary: "Working with data in code.", topics: ["Python basics", "pandas and NumPy", "Reading CSV files and calling APIs"] },
      { title: "Cleaning data", duration: "Week 7", summary: "Making data trustworthy.", topics: ["Duplicates and missing values", "Outliers", "Transforming and combining data"] },
      { title: "Descriptive and statistical analysis", duration: "Week 8", summary: "Finding what the data says.", topics: ["Averages, spread and distributions", "Correlation and regression basics", "Hypothesis testing"] },
      { title: "Visualisation with Power BI", duration: "Weeks 9-10", summary: "Showing results.", topics: ["Choosing the right chart", "Building reports and dashboards", "Telling a story with data"] },
      { title: "An analysis project", duration: "Weeks 11-12", summary: "A full analysis.", topics: ["Framing the question", "Cleaning, analysing and visualising", "Presenting findings"] },
    ],
  },
  {
    trackSlug: "ai-prompt",
    modules: [
      { title: "How language models work", duration: "Weeks 1-2", summary: "What you are prompting.", topics: ["What an LLM is and how it generates text", "Tokens and context", "Strengths and limits, including wrong answers"] },
      { title: "Prompting techniques", duration: "Weeks 3-4", summary: "Getting better answers.", topics: ["Clear instructions and examples", "Few-shot prompting", "Chain of thought", "Roles and context"] },
      { title: "Output control and structured outputs", duration: "Week 5", summary: "Predictable results.", topics: ["Controlling format and length", "JSON and other structured outputs"] },
      { title: "Tuning parameters", duration: "Week 6", summary: "Settings that change behaviour.", topics: ["Temperature and sampling", "Repetition penalties"] },
      { title: "Testing prompts automatically", duration: "Week 7", summary: "Measuring quality.", topics: ["Test sets for prompts", "Comparing prompt versions", "Automatic prompt improvement"] },
      { title: "Safety and red teaming", duration: "Week 8", summary: "Where prompts fail.", topics: ["Prompt injection and jailbreaks", "Testing a system for weaknesses"] },
      { title: "A prompt-based project", duration: "Weeks 9-12", summary: "Build with prompts.", topics: ["Choosing a real task", "Designing, testing and improving prompts", "Presenting the result"] },
    ],
  },
  {
    trackSlug: "ai-auto",
    modules: [
      { title: "APIs, Git and the terminal", duration: "Weeks 1-2", summary: "The developer basics.", topics: ["Command line basics", "Git and GitHub", "REST APIs and calling them from code"] },
      { title: "LLM basics and embeddings", duration: "Weeks 3-4", summary: "How models work with text.", topics: ["Transformers and LLMs in plain terms", "Reasoning vs standard models, open vs closed models", "Embeddings and vector search", "Model pricing"] },
      { title: "Retrieval-augmented generation (RAG)", duration: "Weeks 5-6", summary: "Giving models your data.", topics: ["What RAG is", "Chunking, embedding and searching documents", "Building a RAG assistant"] },
      { title: "Tools and the agent loop", duration: "Weeks 7-8", summary: "Letting models act.", topics: ["Tool definitions and function calling", "The agent loop", "Patterns: ReAct, planner-executor"] },
      { title: "Agent memory", duration: "Week 9", summary: "Remembering across steps.", topics: ["Short-term and long-term memory", "Episodic vs semantic memory"] },
      { title: "Model Context Protocol (MCP)", duration: "Week 10", summary: "A standard way to connect tools.", topics: ["What MCP is", "Using and creating an MCP server"] },
      { title: "Safety and guardrails", duration: "Week 11", summary: "Keeping agents in bounds.", topics: ["Prompt injection", "Limiting what tools can do", "Privacy and removing personal data", "Bias checks and red-team testing"] },
      { title: "An automation project", duration: "Week 12", summary: "Build an agent that does a real job." },
    ],
  },
  {
    trackSlug: "product",
    modules: [
      { title: "Market and user research", duration: "Weeks 1-2", summary: "Finding real problems.", topics: ["Identifying a product opportunity", "Market analysis", "User interviews and research methods"] },
      { title: "Positioning and value proposition", duration: "Weeks 3-4", summary: "Saying why it matters.", topics: ["Vision and mission", "Value vs features", "Positioning and value proposition"] },
      { title: "Requirements, roadmap and backlog", duration: "Weeks 5-6", summary: "Planning what to build.", topics: ["Defining goals", "Writing product requirements", "Roadmaps and prioritising a backlog", "Release strategies"] },
      { title: "Agile and working with engineers", duration: "Week 7", summary: "Delivering with a team.", topics: ["Agile methods and ceremonies", "Working with engineering and design"] },
      { title: "Product metrics", duration: "Week 8", summary: "Knowing if it works.", topics: ["Key product metrics", "Data-driven decisions and feedback loops"] },
      { title: "Managing stakeholders", duration: "Week 9", summary: "Aligning people.", topics: ["Communication", "Managing expectations and conflict", "Identifying and monitoring risks"] },
      { title: "A product case study", duration: "Weeks 10-12", summary: "Plan a product end to end.", topics: ["Research, positioning and roadmap", "Metrics and go-to-market", "Presenting your case"] },
    ],
  },
  {
    trackSlug: "project",
    modules: [
      { title: "Foundations and project initiation", duration: "Weeks 1-2", summary: "What projects are, and starting one well.", topics: ["Projects vs ongoing operations; the project lifecycle", "The project manager's role and methodologies", "Project charter and SMART goals", "Stakeholder identification and expectations", "Governance and the kickoff meeting"] },
      { title: "Scope and schedule", duration: "Weeks 3-4", summary: "Breaking work down and sequencing it.", topics: ["Work breakdown structure", "Task dependencies and sequencing", "Critical path, milestones and Gantt charts"] },
      { title: "Resources, cost and procurement", duration: "Weeks 5-6", summary: "Money and people.", topics: ["Cost estimation and budgeting", "Resource levelling", "Earned value tracking", "Vendors and contracts"] },
      { title: "Risk", duration: "Week 7", summary: "Planning for what could go wrong.", topics: ["Qualitative and quantitative risk assessment", "Mitigation and contingency plans", "The risk register"] },
      { title: "Execution and quality", duration: "Week 8", summary: "Running the work.", topics: ["Quality metrics", "Change control and scope creep", "Status reports and team communication", "Resolving blockers and conflict"] },
      { title: "Agile delivery and closeout", duration: "Weeks 9-10", summary: "Iterative delivery and finishing well.", topics: ["Scrum roles, events and Kanban", "Sprint backlog and estimation", "Acceptance, handover and sign-off", "Retrospectives and lessons learned"] },
      { title: "Capstone project", duration: "Weeks 11-12", summary: "Run a full project from charter to closeout." },
    ],
  },
  {
    trackSlug: "virtual",
    modules: [
      { title: "The VA role and a professional workspace", duration: "Weeks 1-2", summary: "Setting up as a remote assistant.", topics: ["What virtual assistants do", "A secure remote workspace", "Writing standard operating procedures"] },
      { title: "Inbox, calendar and communication", duration: "Weeks 3-4", summary: "The core admin work.", topics: ["Inbox management and email triage", "Professional business writing", "Calendars across time zones"] },
      { title: "Travel and event coordination", duration: "Week 5", summary: "Planning for clients.", topics: ["Researching flights and lodging", "Itineraries and handling disruptions", "Meeting logistics, event budgets and expenses"] },
      { title: "Documents and digital organisation", duration: "Weeks 6-7", summary: "Keeping client work tidy.", topics: ["Google Workspace shared drives", "Notion workspaces", "File naming and version control", "Spreadsheet data entry and cleaning", "Presentations in Canva"] },
      { title: "Task and project tracking", duration: "Weeks 8-9", summary: "Keeping work moving.", topics: ["Asana and Trello boards", "Prioritising competing requests", "Progress reports and meeting minutes"] },
      { title: "Finding and onboarding clients", duration: "Weeks 10-11", summary: "Running the business.", topics: ["Choosing a niche", "Pricing: hourly and retainer", "Service agreements", "Discovery calls and pitching", "Client onboarding, invoicing and payments"] },
      { title: "Mock client project", duration: "Week 12", summary: "Serve a practice client end to end." },
    ],
  },
  {
    trackSlug: "marketing",
    modules: [
      { title: "Marketing strategy foundations", duration: "Week 1", summary: "Starting from the customer.", topics: ["The digital customer journey", "Buyer personas and audience research", "Value propositions", "Competitor analysis", "Channel choice and budget"] },
      { title: "Search engine optimisation", duration: "Weeks 2-3", summary: "Earning search traffic.", topics: ["Keyword research", "On-page optimisation", "Search intent and content structure", "Backlinks and authority", "Auditing with Google Search Console"] },
      { title: "Content and social media", duration: "Weeks 4-5", summary: "Building an audience.", topics: ["Content pillars and calendars", "Platform formats and short video", "Community engagement", "Repurposing content"] },
      { title: "Paid search and display ads", duration: "Week 6", summary: "Google Ads.", topics: ["Account and campaign structure", "Ad copy", "Bidding and return on ad spend", "Display targeting and retargeting"] },
      { title: "Paid social ads", duration: "Week 7", summary: "Meta Ads.", topics: ["Campaign objectives", "Custom and lookalike audiences", "Testing creatives", "Scaling budgets and ad policy basics"] },
      { title: "Email marketing and automation", duration: "Weeks 8-9", summary: "Keeping customers.", topics: ["Building lists with opt-in", "Deliverability and list hygiene", "Welcome and abandoned-cart flows", "Metrics and split tests", "E-commerce store basics"] },
      { title: "Analytics and conversion", duration: "Weeks 10-11", summary: "Measuring results.", topics: ["Conversion tracking with Google Tag Manager", "Google Analytics 4", "Attribution models", "Landing page optimisation", "Reporting dashboards"] },
      { title: "A campaign project", duration: "Week 12", summary: "Plan and present a full campaign." },
    ],
  },
  {
    trackSlug: "cyber",
    modules: [
      { title: "IT basics", duration: "Weeks 1-2", summary: "How computers and devices work.", topics: ["Hardware components and connection types", "Troubleshooting basics", "Office suites and cloud productivity tools", "Virtual machines and a safe lab setup"] },
      { title: "Linux and operating systems", duration: "Weeks 3-4", summary: "Working at the command line.", topics: ["Linux, Windows and macOS compared", "The command line, files and permissions", "Installing and updating software", "Common commands"] },
      { title: "Networking", duration: "Weeks 5-6", summary: "How data moves.", topics: ["The OSI model and common protocols", "IP addresses, subnets, DNS and DHCP", "Ports, routers, switches and VLANs", "Tools: ping, traceroute, nmap, Wireshark"] },
      { title: "Security concepts", duration: "Weeks 7-8", summary: "The ideas behind defence.", topics: ["The CIA triad, risk, and defence in depth", "Authentication, MFA and Zero Trust", "Hashing, keys and certificates", "Compliance basics and security teams (red, blue, purple)"] },
      { title: "Attacks and defences", duration: "Weeks 9-10", summary: "Threats and how to stop them.", topics: ["Phishing and social engineering", "Malware and web attacks (OWASP Top 10)", "Firewalls, IDS/IPS, antivirus, EDR and hardening", "Logs, SIEM and basic incident response"] },
      { title: "Cloud security basics", duration: "Week 11", summary: "Securing cloud workloads.", topics: ["Shared responsibility", "Identity and access in the cloud"] },
      { title: "Hands-on security project", duration: "Week 12", summary: "Practice in a lab.", topics: ["A guided exercise on a safe practice platform", "Writing up findings"] },
    ],
  },
  {
    trackSlug: "design",
    modules: [
      { title: "Understanding users and the product", duration: "Weeks 1-2", summary: "Starting from people.", topics: ["Product design vs UX vs UI", "Setting goals, vision and success measures", "User research methods", "Personas, empathy maps and problem statements"] },
      { title: "Flows and structure", duration: "Weeks 3-4", summary: "Organising the experience.", topics: ["Site maps and information architecture", "User flows and task flows", "Sketching and brainstorming"] },
      { title: "Wireframes and prototyping in Figma", duration: "Weeks 5-6", summary: "Making ideas testable.", topics: ["Wireframes", "Interactive prototypes", "Components in Figma"] },
      { title: "UI design basics", duration: "Week 7", summary: "Making it look right.", topics: ["Colour, type, layout and grid", "Visual hierarchy and icons", "Interface states and UI patterns"] },
      { title: "Usability testing", duration: "Week 8", summary: "Checking with real people.", topics: ["Running usability tests", "Accessibility testing", "Design critiques"] },
      { title: "Best practices and handoff", duration: "Week 9", summary: "Working with developers.", topics: ["Inclusive and ethical design", "UX writing and microcopy", "Specs, edge cases and handoff"] },
      { title: "Portfolio case study", duration: "Weeks 10-12", summary: "Show your process.", topics: ["Choose a product problem", "Research, design, test", "Presenting a portfolio case study"] },
    ],
  },
];

export function curriculumFor(slug: string, curricula: readonly Curriculum[] = CURRICULA): Curriculum | null {
  return curricula.find((c) => c.trackSlug === slug) ?? null;
}
