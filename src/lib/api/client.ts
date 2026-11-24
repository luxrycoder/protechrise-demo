import type { z } from "zod";
import { buildError, failure, kindForStatus, success, type ApiErrorKind, type ApiResult } from "@/lib/api/result";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type ClientConfig = {
  /** Empty (the default) means same-origin relative URLs, which is what the browser uses through the proxy. */
  readonly baseUrl?: string;
  readonly fetchImpl?: FetchLike;
  readonly sleep?: (ms: number) => Promise<void>;
  /** Per-attempt timeout. */
  readonly timeoutMs?: number;
};

export type RequestOptions<T> = {
  readonly method?: "GET" | "POST";
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
  readonly body?: unknown;
  readonly schema: z.ZodType<T>;
  /** Retry a 503 the API marks `retryable` (the database was briefly locked). Default true. */
  readonly retryBusy?: boolean;
  /** Called before each wait so the UI can say "still trying". */
  readonly onWait?: (attempt: number, delayMs: number) => void;
  /**
   * Called with the successful response (after its body has been validated) so a caller can read headers, for
   * example the event ids the application submit response carries. Not called for failures. The body is already
   * consumed; do not read it again.
   */
  readonly onResponse?: (response: Response) => void;
  readonly signal?: AbortSignal;
};

/**
 * Waits between retries of a locked-database 503: about five and a half minutes in total, the same
 * schedule as the legacy `busy-retry.js`. The body is resent unchanged, so a submission is not lost.
 * Unlike the legacy helper this only retries a 503 the API flags `retryable: true`; a plain 503 such as
 * "applications are not open" is permanent and is reported straight away.
 */
export const BUSY_RETRY_DELAYS_MS: readonly number[] = [2000, 4000, 8000, 15000, 30000, 30000, 60000, 60000, 60000, 60000];

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_DETAIL = 300;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function summariseIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ")
    .slice(0, MAX_DETAIL);
}

function buildUrl(baseUrl: string, path: string, query?: Readonly<Record<string, string>>): string {
  const qs = query && Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : "";
  return `${baseUrl}${path}${qs}`;
}

function errorKindFor(thrown: unknown, callerAborted: boolean): ApiErrorKind {
  const name = thrown instanceof Error || thrown instanceof DOMException ? thrown.name : "";
  if (name === "TimeoutError") return "timeout";
  if (name === "AbortError") return callerAborted ? "aborted" : "timeout";
  return "network";
}

/** One attempt, with its own timeout, linked to the caller's abort signal. */
async function attempt(
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  caller?: AbortSignal,
): Promise<{ response: Response } | { thrown: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), timeoutMs);
  const onCallerAbort = () => controller.abort(caller?.reason ?? new DOMException("Aborted", "AbortError"));
  caller?.addEventListener("abort", onCallerAbort, { once: true });
  try {
    return { response: await fetchImpl(url, { ...init, signal: controller.signal }) };
  } catch (thrown) {
    return { thrown };
  } finally {
    clearTimeout(timer);
    caller?.removeEventListener("abort", onCallerAbort);
  }
}

/**
 * Call the waitlist-api and return a typed result. Never throws: network failures, timeouts, HTTP
 * errors and responses that do not match the schema all come back as `{ ok: false, error }`.
 */
export async function apiRequest<T>(config: ClientConfig, options: RequestOptions<T>): Promise<ApiResult<T>> {
  const fetchImpl = config.fetchImpl ?? ((url, init) => fetch(url, init));
  const sleep = config.sleep ?? defaultSleep;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const method = options.method ?? "GET";
  const url = buildUrl(config.baseUrl ?? "", options.path, options.query);
  const hasBody = method !== "GET" && options.body !== undefined;
  const init: RequestInit = {
    method,
    headers: { Accept: "application/json", ...(hasBody ? { "Content-Type": "application/json" } : {}) },
    ...(hasBody ? { body: JSON.stringify(options.body) } : {}),
  };

  for (let tries = 0; ; tries += 1) {
    if (options.signal?.aborted) return failure(buildError("aborted", null));

    const outcome = await attempt(fetchImpl, url, init, timeoutMs, options.signal);
    if ("thrown" in outcome) {
      const kind = errorKindFor(outcome.thrown, Boolean(options.signal?.aborted));
      const detail = outcome.thrown instanceof Error ? outcome.thrown.message : String(outcome.thrown);
      return failure(buildError(kind, null, undefined, detail.slice(0, MAX_DETAIL)));
    }

    const { response } = outcome;
    const json = parseJson(await response.text());

    if (response.ok) {
      const parsed = options.schema.safeParse(json);
      if (!parsed.success) {
        return failure(buildError("invalid_response", response.status, undefined, summariseIssues(parsed.error)));
      }
      options.onResponse?.(response);
      return success(parsed.data);
    }

    const retryableFlag = json !== null && typeof json === "object" && (json as { retryable?: unknown }).retryable === true;
    const canRetry = response.status === 503 && retryableFlag && options.retryBusy !== false;
    if (canRetry && tries < BUSY_RETRY_DELAYS_MS.length) {
      const delay = BUSY_RETRY_DELAYS_MS[tries] as number;
      options.onWait?.(tries + 1, delay);
      await sleep(delay);
      continue;
    }
    return failure(buildError(kindForStatus(response.status, retryableFlag), response.status, json));
  }
}
