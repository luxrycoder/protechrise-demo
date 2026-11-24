// Local-only stand-in for waitlist-api so the redesigned pages can be reviewed without a backend.
// Serves just what the public pages read. Usage: node scripts/dev-mock-api.mjs   (then API_ORIGIN=http://localhost:3055)
import http from "node:http";

const tracks = [
  ["frontend", "Frontend Development", "Software", "059669", "Build websites people use, from HTML and CSS to React.", "Ada O."],
  ["backend", "Backend Development", "Software", "059669", "Servers, databases and APIs that power real apps.", "Tunde B."],
  ["mobile", "Mobile App Development", "Software", "059669", "Ship an Android and iPhone app from one Flutter codebase.", "Emeka N."],
  ["cloud", "Cloud Computing", "Cloud & Security", "2563EB", "Azure first, with AWS and Google Cloud beside it.", "Ngozi E."],
  ["cyber", "Cybersecurity", "Cloud & Security", "2563EB", "How systems are attacked and defended, in a safe lab.", "Amara D."],
  ["data", "Data Analytics", "Data & AI", "7C3AED", "Excel, SQL, Python and Power BI, from raw data to answers.", "Zainab M."],
  ["ai-prompt", "AI Prompt Engineering", "Data & AI", "7C3AED", "Get dependable results from AI tools, and know when not to trust them.", "Kelechi A."],
  ["ai-auto", "AI Automation", "Data & AI", "7C3AED", "Build small AI helpers that do tasks for you.", "Folake S."],
  ["product", "Product Management", "Product & Design", "F97316", "How teams decide what to build, with real case studies.", "Ifeanyi C."],
  ["design", "UI/UX Design", "Product & Design", "F97316", "From first sketch to a tested prototype in Figma.", "Yusuf K."],
  ["project", "Project Management", "Product & Design", "F97316", "Planning, scheduling and teamwork with practical templates.", "Halima Y."],
  ["marketing", "Digital Marketing", "Business", "D97706", "Reach and keep customers online, with live campaign practice.", "Obinna L."],
  ["virtual", "Virtual Assistance", "Business", "D97706", "The day-to-day skills of supporting a business from anywhere.", "Bisi T."],
].map(([slug, name, category, color, blurb, instructor], i) => ({
  slug, name, category, color, blurb, instructor, sortOrder: i + 1, difficulty: "beginner", enrolleeCount: [412, 388, 301, 276, 198, 354, 242, 187, 165, 220, 96, 143, 88][i],
}));

const routes = {
  "/api/tracks": { ok: true, cohort: "cohort-2", payAtApply: false, tracks },
  "/api/public-fee": { ok: true, fee: "₦30,000", tuition: "₦300,000", scholarshipPercent: 90 },
  "/api/public-applicant-countries": {
    ok: true, totalCountries: 14,
    countries: [["Nigeria", 1840], ["Ghana", 212], ["Kenya", 164], ["South Africa", 97], ["Cameroon", 71], ["Uganda", 58], ["Rwanda", 41], ["Zambia", 33], ["Tanzania", 29], ["Ethiopia", 22]].map(([name, count]) => ({ name, count })),
  },
  "/api/health": { ok: true },
};

http.createServer((req, res) => {
  const path = (req.url ?? "").split("?")[0];
  const body = routes[path];
  res.writeHead(body ? 200 : 404, { "content-type": "application/json" });
  res.end(JSON.stringify(body ?? { ok: false }));
}).listen(3055, () => console.log("mock api on http://localhost:3055"));
