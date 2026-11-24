# Learner portal

`/portal` is the admissions-side home for a paid learner (issue #46). It shows where they stand, what to do before
class starts, and opens the learning platform (the LMS). It is **not** the LMS: lessons, quizzes, attendance and
certificates live there. The portal only exists while the API's `PORTAL_ENABLED` flag is on; when it is off every
`/api/portal/*` route answers 404 and the page shows a plain "Page not found".

The behaviour mirrors the legacy `waitlist-api/public/portal.html` (`assets/portal.js`, `assets/portal-lms.js`).

## What a learner sees

| Screen | When |
|---|---|
| Sign-in prompt | 401: no session. Links to `/status?next=/portal`; the email link returns the learner to `/portal`. |
| "Page not found" | 404: the portal is switched off. A plain not-found page with the same heading as the site's 404 (the body text differs, because the site's own 404 mentions the dev build); it never says "portal". |
| "We could not load your portal" + Try again | network, timeout, busy, rate limit, server, or an answer that does not match the schema. |
| "We are confirming your seat" | `confirming`: paid, not cleared yet. Checks again by itself (see below). |
| "Taking longer than expected" + support | `stuck`. |
| "We have not received your payment yet" + link to `/status` | `not_paid` (the API also answers this for a learner who can never clear, so nobody is told why). |
| "Not available right now" | any state we do not know. |
| **Home** | `eligible`: the cards below. |

Home cards, in order (a card whose data is missing is hidden, never faked): welcome and class-start countdown,
**Your details** (student ID, track, cohort, pod), **classroom (LMS)**, **checklist**, **community**,
**announcements**, **upcoming sessions**, **receipt** (printable), **help**, sign out.

`/status` links to the portal ("Open your portal") for a learner with a confirmed payment, but only when
`GET /api/portal/state` says it is open for them. A 404, 401, any failure or `not_paid` keeps the link hidden.

## Code map

| Piece | File |
|---|---|
| Route (noindex, never cached) | `src/app/portal/page.tsx` |
| Page state machine, polling, sign out | `src/features/portal/portal-app.tsx` |
| Screen choice and gate wording (pure) | `src/features/portal/portal-screen.ts` |
| Home cards (view model, pure) | `src/features/portal/home-view.ts`, drawn by `portal-home.tsx` |
| Classroom card and hand-off outcome (pure) | `src/features/portal/lms-card.ts` |
| Checklist, announcements, sessions, completing a task (pure) | `src/features/portal/items-view.ts` |
| Link from `/status` | `src/features/portal/portal-link.ts` (pure), `portal-link-view.tsx` |
| Helpers: safe links, hand-off URL check, dates, countdown, retry bounds, checklist | `src/lib/portal.ts` |
| Response schemas | `src/lib/api/schemas/portal.ts`; calls in `src/lib/api/portal.ts` |
| Styles | `src/features/portal/portal.module.css` (print rules also in `src/app/globals.css`) |

Tests: `tests/portal.test.ts`, `tests/features/{portal-screen,home-view,lms-card,items-view,portal-link}.test.ts`, and the
fixtures in `tests/fixtures/api/from-code/portal-*.json` (contract test in `tests/api/contract.test.ts`).
The `.tsx` components have no automated tests (no DOM test setup yet, issue #10); keep logic in the pure files.

## API used

| Call | Used for |
|---|---|
| `GET /api/portal/home` | the home, or a gate body (`confirming`, `stuck`, `not_paid`) |
| `GET /api/portal/state` | the gate only; used by the `/status` link |
| `POST /api/portal/items/complete` | `{ itemId }` for a confirm task, `{ itemId, acceptedHash }` for a consent task |
| `POST /api/status/lms-handoff` | the one-time classroom address, only when the learner presses the button |
| `POST /api/status/logout` | sign out |

**The response shapes are derived by hand from the legacy handlers** (`lib/portal-home.js`, `lib/portal-state.js`,
`lib/portal-items.js`, `app.js`), because the flag is off on the dev API and no test account existed to record real
responses. The portal fixtures say so in `_source`. Replace them with recordings (`npm run fixtures:record`) once the
flag is on and a test account exists, and check the schemas against them.

Backend flags involved: `PORTAL_ENABLED` (the portal), `PORTAL_LMS_DOOR_ENABLED` and `LMS_HANDOFF_ENABLED` (the classroom card).

## Rules the code follows

- **Never fake data.** A block that does not parse is dropped (`.catch(undefined)`); a list entry that does not parse is
  dropped; a missing value reads "—", or "Being assigned" for student ID and pod (as the legacy page does).
- **Staff text is plain text.** Never `dangerouslySetInnerHTML`. Links from staff or the API go through `safeLink` /
  `safeSupportUrl` (https, or our own `/community`, `/status`, `/portal`; support may also be `mailto:`).
  The community link is always our own `/community`, whatever `url` the API sends.
- **The LMS hand-off address is a secret, and goes only to the LMS.** It carries a one-time ticket in its `#fragment`.
  It is requested only on a click and checked with `handoffHref` (`src/lib/portal.ts`) against the **configured LMS
  origin** (`LMS_ORIGIN`, read on the server by `src/lib/lms-origin.ts`): exactly that scheme, host and port; path
  `/academy/handoff`; no query or credentials; a 43-character ticket; no whitespace, control characters or backslashes.
  The check returns the parsed `href`, which is what is handed to `window.location.assign`. It is never put in state,
  rendered, logged or stored. Anything that fails, and every address when `LMS_ORIGIN` is missing or invalid, is an
  error message, not a navigation (a ready classroom with no origin shows "not available", never a dead button).
  `LMS_ORIGIN` must match waitlist-api's `LMS_DASHBOARD_URL`, which pins the same origin before it will mint a ticket.
- **Consent is never accepted for the learner.** A 409 ("wording changed") shows the fresh wording and asks them to read it again.
- **One request per press.** A ref guards repeat clicks on both the classroom button and each task.
- **Polling while "confirming"** honours `retryAfterSeconds` within 10-300 s, backs off by 50% every 10 checks, does not
  poll while the tab is hidden (checks once on return), and stops after 120 checks with a "Check again" button.
- **Sign out ends the portal session only.** It does not end an LMS or forum session (see the SSO contract, section 4,
  in `waitlist-api/docs/portal-sso-contract.md`). The copy never claims otherwise, and never promises automatic sign-in
  to the LMS: until the LMS "SSO-1" ships, the hand-off may land on the LMS login.

## Accessibility and layout

Checked at 320, 360 and desktop widths: no horizontal scroll, long names, tracks, amounts and staff text wrap.
Focus moves to the screen's heading when the screen changes; status text uses `role="status"`/`aria-live="polite"`;
one `h1`, then `h2` per card and `h3` per item; all buttons and links have names; every focusable element has a
visible indicator; tab order follows reading order. Primary buttons use the deeper green (`--color-primary-deep`)
because white on the base green (`--color-primary`) is 3.8:1, below the 4.5:1 that this text size needs.
The same base green is used for buttons elsewhere on the site and is worth a separate look.
The spinner stops under `prefers-reduced-motion`. Printing the receipt hides every other card and the site header and footer.

## Trying it locally

The flag is off on dev, so run a small mock of the API and point the app at it (do not commit the mock or its data):

```bash
API_ORIGIN=http://localhost:4101 npx next dev -p 3101
```

A mock only needs `GET /api/portal/home` (and `/api/portal/state`, `/api/status/me`, `/api/status/logout`,
`/api/status/lms-handoff`, `POST /api/portal/items/complete` for the flows that use them). The bodies in
`tests/fixtures/api/from-code/portal-*.json` are a good starting point. Cases worth trying: each gate state, 401, 404,
a home with no optional blocks, very long text, `lms` in each state, a 409 on a consent task, and a hand-off answer
that is off-site or has no ticket.

## Recording real portal responses (issue #141)

Sign in on the dev site, copy the applicant session cookie from the browser, and pass it through the environment only
(never in a file or chat). One run per state, with a label:

```bash
PORTAL_SESSION_COOKIE='name=value' PORTAL_LABEL=eligible npm run fixtures:record -- https://dev-api.protechrise.com
```

This writes `tests/fixtures/api/portal-home-<label>.json` and `portal-state-<label>.json` (GET only). Then wire them into
`tests/api/contract.test.ts` and delete the matching hand-derived files in `from-code/`.

## Not built yet / blocked

- **Real responses**: needs the portal flag and a test account on dev.
- **LMS single sign-on** (LMS "SSO-1"), **Discourse sign-in** (no DiscourseConnect exists yet), a **person ID** so one
  email with several applications maps to one identity, **sign out everywhere** and logout propagation, and a
  **read-only LMS progress summary** (next live class, attendance, quiz and certificate state). All backend work in
  `waitlist-api` and `protechrise_academy`; the portal shows a door only when the API reports it ready.
- **Staff content** (checklist, announcements, sessions) is authored in the admin (issue #69); until then those sections are empty and hidden.
- Open question: with several applications on one email, which one `/api/portal/home` serves.
