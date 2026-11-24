import { parseEnv } from "@/lib/env";

export type FetchLike = (url: string, init?: RequestInit & { next?: { revalidate: number } }) => Promise<Response>;

const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 4000;

/**
 * GET a JSON document from this environment's API. Returns null (and logs the cause) on any
 * failure, so a page can degrade instead of throwing. The caller must still validate the shape.
 */
export async function fetchApiJson(
  apiOrigin: string,
  path: string,
  fetchImpl: FetchLike = fetch,
): Promise<unknown | null> {
  try {
    const res = await fetchImpl(`${apiOrigin}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      // A 4xx means the endpoint is absent or refused us, which pages already handle by degrading,
      // so it is a warning; only a server fault (5xx) is an error. console.error opens the Next dev overlay,
      // so in local development (where the API is often absent or a different app) it stays a warning too.
      const log = res.status >= 500 && process.env.NODE_ENV !== "development" ? console.error : console.warn;
      log(`api ${path}: responded ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    // An unreachable API during local development (nothing running, wrong port) is routine and pages degrade
    // around it, so keep it out of the Next dev overlay; in production it stays an error.
    const log = process.env.NODE_ENV === "development" ? console.warn : console.error;
    log(`api ${path}: request failed`, error instanceof Error ? error.message : error);
    return null;
  }
}

/** Server-side convenience: the API origin from this process's environment, or null if it is not configured. */
export function apiOriginFromEnv(): string | null {
  try {
    return parseEnv(process.env).apiOrigin;
  } catch (error) {
    console.error("api: environment not ready", error instanceof Error ? error.message : error);
    return null;
  }
}
