# API client

Typed client for the applicant-facing `waitlist-api` endpoints, in `src/lib/api/`. Every applicant feature
(application form, status portal, claim, referrers, portal) calls the API through it, so error handling, retries and
validation live in one place.

```ts
import { createApi } from "@/lib/api";

const api = createApi();                       // browser: same-origin relative URLs through the proxy
// const api = createApi({ baseUrl: origin }); // server: absolute API origin

const result = await api.applications.checkEmail("ada@example.com");
if (!result.ok) return showError(result.error.message); // never throws
const { deliverable, alreadyRegistered } = result.data;  // typed and validated
```

## Results, not exceptions

Every call returns `ApiResult<T>`: `{ ok: true, data }` or `{ ok: false, error }`. Network failures, timeouts, HTTP
errors and responses that do not match the schema are all `{ ok: false }`. Nothing is ever rendered unvalidated.

`error` has `kind`, `status`, `message` (safe to show), `retryable` (offer "Try again"), optional `code`, and `body` (the
parsed error body, for extra fields such as `reason`; do not render it).

| `kind` | When | `retryable` |
|---|---|---|
| `network`, `timeout` | no response, or too slow | yes |
| `aborted` | the caller cancelled | no |
| `busy` | 503 flagged `retryable` and the waits ran out (database locked) | yes |
| `unavailable` | any other 503, for example "applications are not open" | yes |
| `rate_limited` | 429 | yes |
| `validation` | 400, or client-side validation failed (per-field messages in `error.body.fields`) | no |
| `unauthorized` | 401: no session | no |
| `forbidden` | 403, including the API's cross-site guard | no |
| `not_found`, `conflict`, `gone`, `too_large` | 404, 409, 410, 413 | no |
| `server` | 5xx | yes |
| `invalid_response` | 2xx that is not JSON or does not match the schema | no |

`message` is the API's own text for 4xx and 503 (it is written for users, for example "Enter a valid first name."),
and a generic sentence otherwise. Technical codes such as `cross_site_request_blocked` never reach it.

## Validation happens before the request

Functions that send data (`applications.submit`, `status.requestLink`, `claim.accept`, ...) validate with a Zod schema
first. An invalid request never reaches the API and comes back as a `validation` error whose `error.body.fields` maps
field name to message, ready to show next to each input. The messages are the legacy server's, word for word.

The application schema (`src/lib/api/schemas/applications.ts`) mirrors the legacy `validateApplicationPayload`: same
fields, limits, option values and messages. The server stays the authority. It also checks things the client cannot:
that the country and city exist in the geo list and that the track is offered by the open cohort.

## Busy database retry

The API's SQLite database is single-writer, so a write can briefly get `503` with `retryable: true`. The client then
waits and retries with the **same body**, on the legacy schedule (2s, 4s, 8s, 15s, 30s, 30s, then 60s four times, about
five and a half minutes), calling `onWait(attempt, delayMs)` so the page can say "still trying". Only
`applications.submit` waits by default; pass `{ retryBusy: true }` to opt another call in, or `false` to opt out.

This differs from the legacy `busy-retry.js`, which retried **every** 503. A 503 is also what "applications are not open
right now" returns, and waiting five minutes for that is pointless, so only a 503 the API flags `retryable` is retried.

## Coverage

| Group | Calls |
|---|---|
| `applications` | `checkEmail`, `submit` |
| `waitlist` | `join` |
| `status` | `requestLink`, `me`, `logout`, `requestTrackChange`, `switchApplication`, `lms`, `lmsHandoff` |
| `claim` | `startInfo`, `accept`, `confirmed` |
| `referrer` | `apply`, `requestLink`, `me`, `logout` |
| `portal` | `state`, `home`, `completeItem` (typed from the legacy handlers; fixtures hand-derived until a test account exists; helpers in `src/lib/portal.ts`; see `docs/PORTAL.md`) |

Not here: `GET /api/tracks` and `GET /api/public-fee` (read server-side with caching in `src/lib/tracks.ts` and
`src/lib/fee.ts`), the legacy server routes outside `/api` (`docs/LEGACY_URLS.md`), and the admin API (milestone M3).

## Adding an endpoint

1. Add a Zod schema for the response (and the input, if it sends data) in `src/lib/api/schemas/`.
2. Add the function to the matching group file (or a new one) using the `request` helper, and wire it in `src/lib/api/index.ts`.
3. Add a fixture and a contract test (below), and an endpoint test in `tests/api/endpoints.test.ts`.

## Fixtures and contract tests

`tests/api/contract.test.ts` checks every schema against fixtures in `tests/fixtures/api/`:

- **Recorded** fixtures come from the real dev API. Refresh them with
  `npm run fixtures:record -- https://dev-api.protechrise.com`, review the diff, commit. The script only reads or sends
  deliberately invalid requests, so it creates and changes nothing, and it refuses to run against production.
- **`from-code/`** fixtures are success shapes that need a signed-in session or a real application, so they cannot be recorded
  from outside. They are derived by hand from the legacy handler (each says so in `_source`). Replace them with recordings
  once a test account exists.

The test fails if a fixture is added without being listed, so a new recording cannot be forgotten.

### Checking against a live API

```bash
API_LIVE_ORIGIN=https://dev-api.protechrise.com npm run test:live
```

Runs the client against a real API (reads and invalid or anonymous calls only; skipped when the variable is unset). Run it
when the API changes to catch drift early. Dev API only.
