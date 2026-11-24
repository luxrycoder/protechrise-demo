# Application form

The three-step scholarship application at `/apply`, in `src/features/application/`. Issue #34 built the UI, fields and
validation; submission details are #35, consent versions #36, drafts and `?track=` #37.

## How it is organised

All behaviour is **pure, tested logic**; the components are thin wiring on top.

| File | What it is |
|---|---|
| `fields.ts` | field ids, which fields belong to which step, `FormValues`, `emptyValues()` |
| `validation.ts` | `validateField` / `validateStep` with the legacy client wording; `buildApplicationInput` maps the form to the API payload |
| `form-state.ts` | the reducer: editing, dependent fields, Next/Back/goto, failed-submit handling |
| `geo.ts` | countries, dial codes, cities, flags (from `src/data/`) |
| `combobox-logic.ts` | search (case and accent insensitive) and arrow-key movement for the pickers |
| `combobox.tsx` | accessible searchable select (ARIA combobox pattern) for country and calling code |
| `field-controls.tsx`, `steps/*` | field components and the three steps |
| `application-form.tsx` | the form shell: progress, focus management, submit |
| `submit.ts` | thin calls to the typed API client: submit (with busy retry and the response hook) and check-email |
| `email-check.ts` | turns a check-email result into duplicate / undeliverable / ok / unknown and the legacy messages |
| `submit-errors.ts` | maps API errors to applicant wording (already submitted, rate limited, busy, closed) |
| `thank-you-url.ts` | builds `/thank-you?name&track&eid&meid` from the form and the event-id response headers |

## Behaviour worth knowing

- **Legacy wording on the form, server wording as the safety net.** The form says "Enter your first name."; the server
  says "Enter a valid first name." (`src/lib/api/schemas/applications.ts`). The form uses the friendlier legacy text; the
  schema still validates everything again at submit.
- **Dependent fields.** Choosing a country sets the calling code and resets the city; leaving "Other" for city or referral
  source clears the extra text; the "Other" fields appear only when needed.
- **Failed Next or Submit** keeps you on the step, shows every error, puts the first error in an alert banner and moves
  focus to that field. The banner disappears as soon as the field it is about is fixed. Moving steps moves focus to the
  step heading.
- **Enter inside an earlier step means Next**, never a submission. Submission is only possible on the last step.
- **Progress dots** only reach steps already visited.
- **Honeypot** field (`website`) is hidden from people; a filled one is accepted silently by the server.
- The preferred track list comes live from `/api/tracks`, grouped by category. With no open cohort or no tracks the form
  is replaced by a notice (the closed state is refined in #23).
- The fee note on step 3 is the live fee, filled in on the server.

### `canSelfFund` means the opposite of its name

The question is **"Do you need scholarship support?"**. The answer `Yes` is stored in the API field `canSelfFund`, so
`Yes` means the applicant **needs** support (the admin dashboard labels it "Needs scholarship support"). The legacy form
sends the select value unchanged and so does this one. Do not invert it: that would flip the meaning against every
existing application. A comment sits at the schema and at the step that renders it.

## Data and attribution

`src/data/geo.json` and `src/data/country-iso.json` are copies of the files the legacy API validates against
(`waitlist-api/public/data/`), so a country or city the form offers is one the server accepts. Keep them identical if the
API's copies change. The data is derived from the dr5hn countries-states-cities database (ODbL) and GeoNames
(CC BY 4.0); the attribution travels in the file's `_source` field and is exposed as `GEO_ATTRIBUTION`. If the form
page needs a visible credit line, add it in the footer or under the form.

## Testing

- Unit tests cover validation (every legacy message and rule), the reducer, the combobox search and the geo data.
- The form was also driven in a real browser against the dev API: validation and focus, both country pickers, grouped
  live tracks, counters, blocked and successful submission, and a narrow (606px) layout.
- That real-browser pass found two bugs unit tests could not: React reused one `<button>` for "Next" and "Submit", so
  the Next click submitted the form (fixed with distinct `key`s), and a stale error banner (fixed in the reducer).
  There is no DOM test environment yet; browser end-to-end tests come with the Playwright harness (#10).

## Submission (#35)

- **Email check on blur.** A well-formed address is checked with `/api/applications/check-email`. A duplicate or
  undeliverable address flags the field and blocks Next and Submit; a check still in flight asks the applicant to
  wait. A failed check never blocks (the server checks again on submit). Editing the address resets the check.
- **Submit.** Guarded by a ref against double clicks. On success the form stays locked and navigates to the thank-you
  URL (`/thank-you?track&eid&meid`, never the applicant's name) with the TikTok/Meta event ids from the response headers (`X-TikTok-Event-Id`, `X-Meta-Event-Id`).
- **Errors.** Wording follows the legacy form; a conflict shows a mailto link. A closed cohort is not described as
  "busy". Answers are kept on every error.
- Verified in a real browser against the dev API: the already-registered address flags on blur. The redirect lands
  on `/thank-you` (#38).

## Consent and policy versions (#36)

- The form sends only `consent: true` and `refundPolicyAccepted: true`; **the API stamps the acceptance time and the
  refund policy version itself** (`REFUND_POLICY_VERSION` in waitlist-api `lib/validators.js`). Nothing about the
  stored audit trail changes. Submitting without both boxes is blocked by the form, and again by the schema.
- The version shown next to the checkbox is read from the refund policy page's own version line
  (`src/lib/policy-version.ts`, `src/content/policy-versions.ts`), so it cannot drift from the page text.
- `tests/policy-version.test.ts` compares that version with `tests/fixtures/policy-contract.json`, the version the API
  records. **Update the page, the fixture and the API together.** The privacy policy has only a date, no version.
- Policy pages are generated, not hand-edited: `node scripts/sync-policy-content.ts <legacy public dir>` rebuilds
  `src/content/{refund-policy,privacy,faq}.ts` from the legacy pages and pins them in `tests/fixtures/legacy-html`.
  `tests/legacy-policy-content.test.ts` fails if the content stops matching the pinned pages. The parser
  (`src/lib/legacy-policy-html.ts`) was validated by regenerating the previous content byte for byte from the older pages.
- Price tokens (`{{ONBOARDING_FEE}}`, `{{TUITION_FEE}}`, `{{SCHOLARSHIP_PERCENT}}`) are filled per request from
  `/api/public-fee` (`src/lib/fee.ts`). If a value is unavailable the page uses a number-free word, never a stale amount.
- Synced on 2026-11-08 from waitlist-api `main` (`2026-11`, Cohort 2 apply-and-pay wording). Home and track page copy is
  not part of this sync yet.

## Apply and pay (#98)

When the open cohort has `payAtApply` (from `GET /api/tracks`), `/apply` renders the one-screen apply-and-pay form instead of the three-step award form. The flow is a value, `FlowId` (`"award" | "payAtApply"`), carried in the form state; `stepsFor(flow)` and `stepFieldsFor(flow, step)` say which fields belong to it, and `validateStep(step, values, flow)` checks them. The short form posts to `POST /api/applications` as a `ShortApplicationInput`, and the response carries `payUrl` (`/claim?token=...`, validated against `CLAIM_PATH`). `destinationAfterSubmit` sends the browser there, and the API turns it into the Paystack redirect. The price block shows the fee and the scholarship percentage from `/api/public-fee`.

Resubmitting an email that already applied returns no `payUrl`: the pay link is emailed only, by design.

## Payment confirmation (#43, #99)

Paystack returns the applicant to `/claim/confirmed` with `reference` and `trxref` (our own links use `ref`). `PaymentStatus` polls `GET /api/claim/confirmed` every 3 seconds, up to 5 times, and `describeAttempt` turns each result into one of four views:

| View | When |
| --- | --- |
| Paid ("You're in") | the API reports `paid`: student ID, fee, cohort start, community link |
| Finalising | not paid yet, and still polling |
| Finalising, with a retry link | polling ran out and the API still offers a claim link (accepted only if it matches `CLAIM_PATH`) |
| Not confirmed | unknown reference, or the API stayed unreachable |

This page only reads state. `paid` is set by the Paystack webhook alone, so nothing here grants access.

## Status page and sign-in (#39)

`/status` is the applicant's page. Sign-in is a passwordless email link: the page posts the address to `POST /api/status/request-link` (the answer is the same whether or not the email is known), the emailed link goes to `/status/verify` (proxied to the API, which sets a same-origin session cookie and redirects back to `/status`), and the page then reads `GET /api/status/me`. No token is ever in this page's URL.

`describeStatus` (`src/features/status/status-view.ts`) turns the `/api/status/me` result into everything the page shows, with no DOM, so the whole status matrix is unit tested:

| Situation | Shows |
| --- | --- |
| Application too new to review | "Thanks for applying" and the time the status becomes available |
| Any funnel status | a pill with the status name (`expired_full_price` reads "Discount Expired") and the dated history in the applicant's own time zone |
| Unpaid, with an open offer | "Claim your scholarship" (or "Continue Enrollment" after the discount window) and the deadline |
| Paid (`paymentConfirmed`, set by the webhook) | the confirmation note, the community button when the hand-off is `/community`, and the pod state and link |

Links the API sends are only followed when they match the known shapes (`/claim?token=`, `/community`, `/community/pod`), and `?next=` is followed only for a path on this site. Track change, switching cohort and the LMS hand-off are #40.

## Claim start page (#42)

`/claim/start?token=` is where the API sends an applicant who was carried to a later cohort and has not yet accepted the policies (`/claim?token=` redirects here, then on to Paystack). It is a page the new app owns; `/claim` itself stays proxied.

- Loads `GET /api/claim/start-info`: the fee (`feeText`) and cohort name come from the API, never computed in the browser. The current course is preselected; if it is not offered in this cohort the applicant must choose one.
- "Continue to payment" stays disabled until the policies are accepted and a course is chosen, then calls `POST /api/claim/accept`.
- The applicant is sent only to the `/claim?token=` path the API returns (matched against `CLAIM_PATH`); anything else is refused. The server turns that into the Paystack redirect, and the webhook alone grants access.
- A 400, 404, 409 or 410 answer to start-info shows "This link is not valid any more"; a network fault, rate limit (429) or server error shows a retry message instead, because shared networks hit 429 and the link is still good.
- The API sends course names as plain strings; the schema also accepts `{name}` objects and reduces them to names.
- Not yet verified end to end on dev: it needs a carried applicant's token and a test payment.

## Status page actions (#40)

On the signed-in status page (`src/features/status/status-actions.ts`, panels in `status-action-panels.tsx`):

- **Course change** (`POST /api/status/track-change`): shown as a form only while the API says `trackChangeEligible`, with the courses from `availableTracks` and a confirm step ("once approved you cannot change again"). Afterwards the page shows the request: pending, approved (with the new Student ID for a paid learner) or declined with the admin's note. A closed window shows the API's own reason text (409). A paid learner is warned first that the Student ID is replaced.
- **Cohort switch** (`POST /api/status/switch`): a selector appears only when the email has more than one application. The API refuses a target on another email, and the page reloads whichever application is actually signed in.
- **Learning platform door** (`GET /api/status/lms`, `POST /api/status/lms-handoff`): shown to paid learners only, hidden when the API reports `disabled`. "Open LMS" requests the hand-off address and follows it only if it is https, on the `/academy/handoff` path and carries no credentials; the address is never stored or shown. Preparing and unavailable offer "Check LMS access again". Who may hand off is decided by the server (scope list, readiness), never by the page.
- A 401 on any action sends the applicant back to the sign-in form.
- Verified in a browser against a mock API; not yet against a real signed-in dev session, which needs a paid applicant and the dev email setup (#16).
