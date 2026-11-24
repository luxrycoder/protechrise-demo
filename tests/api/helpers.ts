import type { FetchLike } from "@/lib/api/client";

export type RecordedCall = { url: string; init: RequestInit | undefined };

export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const textResponse = (status: number, body: string): Response =>
  new Response(body, { status, headers: { "content-type": "text/html" } });

/** A fake fetch that replays responses in order (the last one repeats) and records every call. */
export function recordingFetch(responses: Array<Response | (() => Response) | Error>): {
  fetchImpl: FetchLike;
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  let index = 0;
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    if (next instanceof Error) throw next;
    return typeof next === "function" ? next() : (next as Response).clone();
  };
  return { fetchImpl, calls };
}

export const noSleep = async () => undefined;
