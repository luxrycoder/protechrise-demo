/**
 * Regenerates src/content/{refund-policy,privacy,faq}.ts from the legacy site's pages.
 *
 *   node scripts/sync-policy-content.ts <legacy public dir> [output dir]
 *
 * The legacy pages are waitlist-api/public/{refund-policy,privacy,faq}.html in OctoberCoder/tech-rise-academy. The output
 * directory defaults to src/content. Nothing is edited by hand: re-run this when the legacy pages change, then update
 * tests/fixtures/legacy-html (the pinned copies the content test compares against) and tests/fixtures/policy-contract.json.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFaq, parsePolicyBlocks } from "../src/lib/legacy-policy-html.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [legacyDir, outArg] = process.argv.slice(2);
if (!legacyDir) {
  console.error("usage: node scripts/sync-policy-content.ts <legacy public dir> [output dir]");
  process.exit(1);
}
const outDir = resolve(outArg ?? join(root, "src/content"));
const pinnedDir = join(root, "tests/fixtures/legacy-html");

const read = (name: string): string => readFileSync(join(resolve(legacyDir), `${name}.html`), "utf8");
const data = (value: unknown): string => JSON.stringify(value, null, 2);

const FILES: ReadonlyArray<{ readonly page: string; readonly file: string; readonly body: (html: string) => string }> = [
  {
    page: "refund-policy",
    file: "refund-policy.ts",
    body: (html) =>
      `// Generated from the legacy refund-policy.html by scripts/sync-policy-content.ts; text is carried over verbatim.\n` +
      `// {{ONBOARDING_FEE}}, {{TUITION_FEE}} and {{SCHOLARSHIP_PERCENT}} are resolved at request time from the API (see lib/fee.ts), never baked in.\n` +
      `import type { PolicyBlock } from "./types";\n\nexport const REFUND_BLOCKS: readonly PolicyBlock[] = ${data(parsePolicyBlocks(html))};\n`,
  },
  {
    page: "privacy",
    file: "privacy.ts",
    body: (html) =>
      `// Generated from the legacy privacy.html by scripts/sync-policy-content.ts; text is carried over verbatim.\n` +
      `import type { PolicyBlock } from "./types";\n\nexport const PRIVACY_BLOCKS: readonly PolicyBlock[] = ${data(parsePolicyBlocks(html))};\n`,
  },
  {
    page: "faq",
    file: "faq.ts",
    body: (html) =>
      `// Generated from the legacy faq.html by scripts/sync-policy-content.ts; text is carried over verbatim.\n` +
      `// {{ONBOARDING_FEE}}, {{TUITION_FEE}} and {{SCHOLARSHIP_PERCENT}} are resolved at request time from the API (see lib/fee.ts), never baked in.\n` +
      `import type { FaqContent } from "./types";\n\nexport const FAQ: FaqContent = ${data(parseFaq(html))};\n`,
  },
];

mkdirSync(outDir, { recursive: true });
for (const { page, file, body } of FILES) {
  writeFileSync(join(outDir, file), body(read(page)));
  console.log(`wrote ${join(outDir, file)}`);
}
if (outArg === undefined) {
  mkdirSync(pinnedDir, { recursive: true });
  for (const { page } of FILES) copyFileSync(join(resolve(legacyDir), `${page}.html`), join(pinnedDir, `${page}.html`));
  console.log(`pinned the legacy pages in ${pinnedDir}`);
}
