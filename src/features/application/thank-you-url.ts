export type ThankYouInput = {
  readonly track: string;
  /** From the submit response's `X-TikTok-Event-Id` header, so the browser pixel and the server report ONE conversion. */
  readonly tiktokEventId: string | null;
  /** From the submit response's `X-Meta-Event-Id` header, for the same de-duplication on Meta. */
  readonly metaEventId: string | null;
};

/**
 * Where to send the applicant after a successful submission. The applicant's name is deliberately not
 * included (URLs end up in history and logs). `track` is shown only if it matches a real track; the event ids are
 * always present, empty when the server sent none, so conversion tracking can still run without de-duplication.
 */
export function thankYouUrl({ track, tiktokEventId, metaEventId }: ThankYouInput): string {
  const params = new URLSearchParams({
    track: track.trim(),
    eid: tiktokEventId ?? "",
    meid: metaEventId ?? "",
  });
  return `/thank-you?${params.toString()}`;
}
