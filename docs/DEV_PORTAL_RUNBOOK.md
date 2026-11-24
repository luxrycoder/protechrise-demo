# Runbook: portal on dev (issue #141)

Goal: see `/portal` on `https://dev.protechrise.com` against real API responses and record fixtures.
Dev only. Never touch staging or prod. No secrets in chat, issues or files: paste values in Coolify only.
Backend references are in `OctoberCoder/tech-rise-academy`, `waitlist-api`.

## Read first
- A payment made with test keys, the payment simulator or time travel is stamped `is_test_payment=1`. The portal blocks those and the API answers `not_paid`. So the paid test account must be marked paid by an admin and then have the test flag turned off (step 4).
- Dev has no email provider yet (web issue #16), so no sign-in link can be sent until step 2 is done.
- No dev LMS address is known. Do not point dev at `app.protechrise.com` (production).

## 1. Turn the portal on (Coolify, dev API app)
1. Set `PORTAL_ENABLED=true`. Set `PUBLIC_BASE_URL=https://dev.protechrise.com`.
2. Redeploy (dev deploys are manual). Check the app builds a branch that contains the portal code.
3. Check: `curl -s -o /dev/null -w "%{http_code}\n" https://dev-api.protechrise.com/api/portal/state` should print `401`. `404` means the flag is off or the build lacks the portal.

## 2. Email for the sign-in link (Coolify, dev API app)
1. Copy the email provider variables staging uses into dev (names are in `app.js`, `EMAIL_PROVIDER(S)` and the provider's key variables).
2. Restrict recipients to your test mailbox with the allow-list variable. Confirm its exact name in `waitlist-api` first (not verified). Do this before enabling the provider so no real applicant can be emailed.
3. Redeploy. Request a link from `https://dev.protechrise.com/status` for your test address and check the mail arrives.

## 3. Test applicant
1. In the dev admin, make sure one cohort is open with a start date and has a track.
2. Apply on the dev site with the test mailbox. Accept the application in the admin.

## 4. Paid, and not a test payment (dev admin)
1. `POST /api/admin/mark-paid` (the admin screen's "mark paid") with a reference, amount and currency.
2. `POST /api/admin/applications/payment-flag` with `{ "applicationId": <id>, "isTest": false }`. Admin role needed.
3. Sign in by email link and open `/portal`. Expected: the home, not "not paid".

## 5. Portal items (dev admin, portal screen)
Create one confirm task, one consent task, one info task, one announcement and one event. New items are off and unapproved: switch each on, then the owner approves each (approval is tied to the exact text).

## 6. See each state
| State | How |
|---|---|
| Home | steps 1 to 5 |
| Not paid | `payment-flag` with `isTest: true` on the same applicant, or use an unpaid applicant. Flip back after |
| Consent 409 | Open `/portal`, then in the admin edit the consent wording (approval is withdrawn, re-approve), then press accept in the already-open page |
| Confirming, stuck | On the dev volume only, delete this applicant's row in `discourse_enrollments`. The portal then shows confirming. After `PORTAL_CONFIRM_TIMEOUT_HOURS` (default 2) it shows stuck: set it to `1` and move the clock with `NODE_ENV=staging`, `ALLOW_TIME_TRAVEL=true` and the owner-only time-travel route. Restore the row afterwards |
| LMS hand-off | Phase 2, see below |

## 7. LMS (only with a dev or staging LMS)
Needs its address and keys. Set `LMS_API_URL`, `LMS_API_KEY`, `LMS_HMAC_SECRET`, `LMS_DASHBOARD_URL`, then `LMS_HANDOFF_ENABLED=true` and `PORTAL_LMS_DOOR_ENABLED=true`. Optionally set `LMS_HANDOFF_COHORT_IDS` first. Leave `LMS_SSO_ENABLED` off (tech-rise-academy #217 sets the order).

## 8. Record fixtures
In a browser signed in as the test learner, copy the applicant session cookie (name=value). In a terminal, per state:
```bash
PORTAL_SESSION_COOKIE='name=value' PORTAL_LABEL=eligible npm run fixtures:record -- https://dev-api.protechrise.com
```
Do not paste the cookie anywhere else. Then replace the `from-code/portal-*` files, wire the new names into `tests/api/contract.test.ts`, fix any drift in `src/lib/api/schemas/portal.ts`, run `npx vitest run`.

## 9. Close out
Comment on #141: two applications on one email resolve to the newest one past the review window for the sign-in link; `/portal` serves the session's application and `/status` can switch it. Note the test-payment finding in #141.

## Risks
Real emails (keep the allow-list on), production LMS (never), time travel is one-way on dev, and the cookie must stay out of files and chat.
