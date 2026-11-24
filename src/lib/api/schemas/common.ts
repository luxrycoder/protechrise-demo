import { z } from "zod";

/** `{ ok: true }`: the API's plain success acknowledgement. */
export const OkSchema = z.object({ ok: z.literal(true) });

/** `{ ok: true, message }`: used by the deliberately generic "if that email exists we sent a link" responses. */
export const OkMessageSchema = z.object({ ok: z.literal(true), message: z.string() });
