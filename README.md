# protechrise-web

Next.js 15 front-end for ProTech Rise Academy, built for `dev.protechrise.com`. It is a separate repo and a
separate deployment from the live `tech-rise-academy` / `waitlist-api` environments (prod and staging), which
it does not touch.

The app talks to a waitlist-api over same-origin `/api/*` rewrites. For this environment that must be the
**dev** waitlist-api (own database, Paystack test keys, email allowlist), never staging or prod.

> **Contributing:** see [CONTRIBUTING.md](CONTRIBUTING.md) for how work is tracked (GitHub Issues, labels, milestones), the branch/PR flow and the definition of done.

## Run

```bash
cp .env.example .env.local      # set API_ORIGIN
npm install
npm run dev                     # http://localhost:3100
npm test                        # vitest
npm run typecheck
npm run build
```

## Environment

| Var | Purpose |
|---|---|
| `API_ORIGIN` | Required. Origin of this environment's waitlist-api; `/api/*` is proxied there. |
| `SITE_URL` | Public origin of this site (canonical, Open Graph, sitemap, robots). Optional outside production; **required and https** when `DEV_NOINDEX=false`. |
| `DEV_NOINDEX` | Defaults to on: `X-Robots-Tag: noindex`, `robots.txt` blocks everything, and titles/footer say "(dev)". Set `false` only when promoting to production. |
| `DEV_BASIC_AUTH_USER` / `DEV_BASIC_AUTH_PASS` | Set both to require HTTP basic auth everywhere except `/api/health`. |
| `CSP_REPORT_ONLY` | Set `true` to send the Content Security Policy as report-only (the browser logs violations but blocks nothing). Use it as an escape hatch if a policy change ever breaks a page; leave unset to enforce. |

## Content Security Policy

Every page gets a strict CSP with a fresh per-request nonce, built in `src/lib/csp.ts` and set by `src/proxy.ts`. Scripts run only if they are our own files or carry the nonce (Next.js stamps it automatically). Today nothing is loaded from a third party, so every directive is `'self'`. To allow a vetted origin (for example Sentry or consent-gated analytics), add it to `EXTRA_SOURCES` in `src/lib/csp.ts` for just the directives that need it, with a test. Pages must render per request for nonces to work; the root layout already forces that.

Validation lives in `src/lib/env.ts` and fails fast at boot.

## Deploy (Coolify)

Build from the repo root with the included `Dockerfile` (port 3100, health check at `/api/health`).
`API_ORIGIN` is a **runtime** variable only (the `/api/*` proxy lives in `src/proxy.ts`), so the image builds
without any settings.

## Layout

- `src/app/`: routes (App Router), `src/components/`: shared header/footer, `src/lib/`: env, dev gate, site config.
- `src/lib/api/`: typed client for the applicant endpoints; see [`docs/API_CLIENT.md`](docs/API_CLIENT.md).
- `src/features/portal/`: the learner portal at `/portal`; see [`docs/PORTAL.md`](docs/PORTAL.md).
- `src/features/application/`: the application form; see [`docs/APPLICATION_FORM.md`](docs/APPLICATION_FORM.md).
- `src/data/`: country, dial-code and city data (ODbL and CC BY 4.0, attribution in `geo.json`).
- `tests/`: Vitest unit tests (80% coverage threshold on `src/lib`).
- `reference/`: gitignored local mirror of third-party sites for study only. Never committed or built.
