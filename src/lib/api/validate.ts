import type { z } from "zod";
import { failure, success, type ApiResult } from "@/lib/api/result";

/** First message per field, keyed by field name, ready to show next to each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!(field in errors)) errors[field] = issue.message;
  }
  return errors;
}

/**
 * Validate input before it is sent. A failure is a `validation` ApiError with the per-field messages in
 * `error.body.fields`, so the caller handles bad input and a server-side 400 in one place, and an
 * invalid request never reaches the API.
 */
export function validateInput<S extends z.ZodType>(schema: S, input: unknown): ApiResult<z.output<S>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return success(parsed.data);
  const fields = fieldErrors(parsed.error);
  return failure({
    kind: "validation",
    status: null,
    message: Object.values(fields)[0] ?? "Please check your details and try again.",
    retryable: false,
    body: { fields },
  });
}
