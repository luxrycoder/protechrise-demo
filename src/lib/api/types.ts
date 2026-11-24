import type { RequestOptions } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/result";

/** Per-call options a caller may pass to any endpoint function. */
export type CallOptions = {
  /** Cancel the request (and any retry waits). */
  readonly signal?: AbortSignal;
  /** Called before each wait while the database is busy, so the UI can say "still trying". */
  readonly onWait?: (attempt: number, delayMs: number) => void;
  /** Override whether a busy database is waited out. Only application submission waits by default. */
  readonly retryBusy?: boolean;
  /** Receives the successful response, to read headers. See `RequestOptions.onResponse`. */
  readonly onResponse?: (response: Response) => void;
};

/** The one function every endpoint group is built on. */
export type Requester = <T>(options: RequestOptions<T>) => Promise<ApiResult<T>>;
