# Legacy URL contract

Emails already sent, ads and bookmarks contain URLs that the legacy `waitlist-api` serves. When this front-end
serves the same hostname, every one of them must keep working. This file is the map; the code that enforces it is
`src/lib/legacy-routes.ts` (proxy allow-list, redirects, robots), with tests in `tests/legacy-routes.test.ts` and
`tests/api-proxy.test.ts`. It also feeds the cutover plan (#75).

How a legacy URL is handled here:

- **proxied**: forwarded unchanged (any method, query string and cookies intact) to the API, which answers it.
- **redirect**: permanent (308) redirect to the new URL; query strings are kept.
- **page**: the new front-end must serve a page at exactly this path. The API's redirects send browsers there.

## Server-side routes (answered by the API)

| URL | Where it comes from | What the API does | Here | Issue |
|---|---|---|---|---|
| `/status/verify?token=` (GET and POST) | applicant magic-link emails | GET shows a "Continue" page; POST consumes the token, sets the session, redirects to `/status` | proxied | #33 |
| `/referrer/verify?token=` | referrer magic-link emails | sets the referrer session, redirects to `/referrer` | proxied | #33 |
| `/claim?token=` | award emails | 302 to Paystack checkout, or to `/claim/start?token=`; 404 / 410 / 429 / 503 otherwise | proxied | #33 |
| `/r/<code>` | referral links | counts the click, sets the attribution cookie, 302 to `/application` | proxied | #33, #45 |
| `/community` | after payment | 302 to the community login | proxied | #33 |
| `/community/pod` | applicant status page | 302 to the learner's pod category (needs the applicant session cookie) | proxied | #33 |

Referral codes are `[A-Za-z0-9-]`, at most 64 characters. Anything else is not forwarded.

## Pages the API redirects to (the new front-end must serve these exact paths)

| URL | Reached from | Issue |
|---|---|---|
| `/status` (and `/status?expired=1`) | after `/status/verify` | #39 (built) |
| `/referrer` (and `/referrer?expired=1`) | after `/referrer/verify` | #44 |
| `/claim/start?token=` | `/claim` when policy acceptance is needed | #42 (built) |
| `/claim/confirmed?ref=` | Paystack return URL | #43 (built) |

Until those pages exist these paths return 404 on the new front-end.

## Legacy page URLs that moved

| URL | Becomes | Why |
|---|---|---|
| `/application`, `/application.html`, `/scholarship` | `/apply` | the form now lives at `/apply`; the API redirects to `/application` after `/r/<code>` |
| `/index.html`, `/faq.html`, `/privacy.html`, `/refund-policy.html` | `/`, `/faq`, `/privacy`, `/refund-policy` | clean URLs |

The legacy `/apply` (a 302 to `/application`) is not needed: `/apply` is the real page here.

## Token-link pages still to build

These are static pages in the legacy site that read a token from the query string. They are not proxied; each needs
a page at the same path.

| URL | Issue |
|---|---|
| `/sponsored?token=`, `/join?token=` | #25 |
| `/newsletter-unsubscribe?token=`, `/unsubscribed` | #24 |
| `/thank-you` | #38 |
| `/login`, `/set-password`, `/reset-password`, `/dashboard/*` (staff) | #48, #49 |

## Same-origin, cookies and the cross-site guard

- Session cookies set by the API (`admin_session`, applicant and referrer sessions, the referral attribution cookie)
  are host-only. Through the proxy they are set on the front-end's host, so the browser treats the API as same-origin.
  Verified: `Set-Cookie` passes through intact (`HttpOnly; Path=/; SameSite=Strict; Secure`).
- The API refuses cross-site state-changing requests on `/api/admin/*` (and four other paths). Modern browsers send
  `Sec-Fetch-Site: same-origin` for our pages, which passes. Browsers that send only `Origin` are checked against the
  API's `PUBLIC_BASE_URL` host, so **`PUBLIC_BASE_URL` must be the public host that serves this front-end**
  (in production the same host, `protechrise.com`). On dev the dev API currently has `PUBLIC_BASE_URL` set to the API
  host, so such an old browser would get 403 on admin POSTs; see #16 and #49.
- Links in emails are built from `PUBLIC_BASE_URL`, so the same setting makes magic links land on this front-end.

## Open question

`DISCOURSE_CONNECT_SECRET` is documented in the API README as enabling `/discourse/sso`, but no such route exists in
`app.js` today. Confirm with the API owners whether the community (Discourse) calls anything on the main site's
hostname; if it does, add that path to `src/lib/legacy-routes.ts` before cutover.

## Adding a legacy route

1. Add it to `src/lib/legacy-routes.ts` (exact paths only; avoid prefixes) and to the tables above.
2. Add test cases for it and for a near-miss that must not be proxied.
3. Verify against the dev API that the proxied response (status, `Location`, cookies, body) matches the API's own.
