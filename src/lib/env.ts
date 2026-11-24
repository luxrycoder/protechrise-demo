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
export function parseEnv(raw: Record<string, string | undefined>): AppEnv {
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
