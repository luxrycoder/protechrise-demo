import { z } from "zod";

const RawEnvSchema = z.object({
  API_ORIGIN: z
    .string({ error: "API_ORIGIN is required" })
    .url({ error: "API_ORIGIN must be an absolute URL" }),
  DEV_NOINDEX: z.string().optional(),
  DEV_BASIC_AUTH_USER: z.string().optional(),
  DEV_BASIC_AUTH_PASS: z.string().optional(),
  CSP_REPORT_ONLY: z.string().optional(),
});

export type AppEnv = {
  readonly apiOrigin: string;
  readonly noindex: boolean;
  /** When true the CSP is sent as report-only (the browser logs violations but blocks nothing). */
  readonly cspReportOnly: boolean;
  readonly basicAuth: { readonly user: string; readonly pass: string } | null;
};

/**
 * Validate and normalise environment input. Pure: takes the raw record so it
 * can be tested without touching process.env.
 *
 * Safe defaults for a non-production environment: noindex ON unless explicitly
 * set to "false", basic auth OFF unless both user and password are provided.
 */
export function parseEnv(input: Record<string, string | undefined>): AppEnv {
  // Demo deployment (DEMO_DATA=1 is inlined at build time, see next.config.ts): nothing is ever fetched, so a missing
  // API_ORIGIN is filled with a placeholder instead of crashing the proxy and every page. Not applied outside demo builds.
  const raw = process.env.DEMO_DATA === "1" && !input.API_ORIGIN ? { ...input, API_ORIGIN: "https://demo.invalid" } : input;
  const result = RawEnvSchema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${detail}`);
  }
  const env = result.data;
  const hasAuth = Boolean(env.DEV_BASIC_AUTH_USER && env.DEV_BASIC_AUTH_PASS);
  return {
    apiOrigin: env.API_ORIGIN.replace(/\/+$/, ""),
    noindex: env.DEV_NOINDEX !== "false",
    cspReportOnly: env.CSP_REPORT_ONLY === "true",
    basicAuth: hasAuth
      ? { user: env.DEV_BASIC_AUTH_USER as string, pass: env.DEV_BASIC_AUTH_PASS as string }
      : null,
  };
}
