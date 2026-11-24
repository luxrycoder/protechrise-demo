# Contributing

This repo is the new Next.js front-end for ProTech Rise Academy. It talks to the existing `waitlist-api`
(repo: `OctoberCoder/tech-rise-academy`) and replaces the legacy static site section by section.

## Picking up work

All work is tracked as GitHub **Issues** in this repo. There is no separate board.

1. Open the issue list and filter by **label `ready`** (and by `good first issue` if you are new).
2. Check the issue's **Depends on** section. If a dependency is not done, pick another issue.
3. **Claim it so nobody else picks it up:** assign yourself, replace the `ready` label with `in-progress`, and
   comment with your branch name. One or two issues at a time. When you stop without finishing, unassign yourself and
   put `ready` back.
4. Work on a branch off `main`, named `feat/<issue#>-short-slug` (or `fix/`, `chore/`, `docs/`).
5. Open a pull request that says `Closes #<issue>`. CI (`verify`) must be green and one teammate must review.
6. Merge on GitHub. Do not push directly to `main`.

If an issue is unclear, ask in the issue before building. Do not start issues labelled `blocked` or
`needs-decision`; add your input to the issue instead.

### How the issues are organised

| Thing | Meaning |
|---|---|
| **Epics** (label `epic`) | One per milestone. Each lists its issues and shows progress. Do not work on an epic directly. |
| **Milestones M0 to M5** | M0 team foundations, M1 public site, M2 applicant flow, M3 admin, M4 backend, M5 delivery and cutover |
| `area:*` | `public`, `applicant`, `admin`, `api`, `infra`. The four lanes below map to these |
| `size:S/M/L/XL` | About a day, 2-3 days, a week, more than a week (split it when you pick it up) |
| `P0` / `P1` / `P2` | Critical path, needed for launch, later |
| `ready` | Specified well enough to start and not yet claimed |
| `in-progress` | Claimed. Someone is working on it; do not pick it up |
| `blocked` / `needs-decision` | Waiting on something outside the issue |

**Lanes** let several people work at once without colliding: public and design (M1), applicant (M2),
admin (M3), platform (M0, M4, M5).

## Getting started

```bash
cp .env.example .env.local        # set API_ORIGIN (use the dev API, never staging or prod)
npm install
npm run dev                       # http://localhost:3100
```

| Command | What it does |
|---|---|
| `npm test` | Vitest unit tests |
| `npm run test:coverage` | Same, with the 80% threshold on `src/lib` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Production build (must work with no environment variables set) |

See `README.md` for environment variables and `docs/DEPLOY_DEV.md` for how dev is deployed.

## Definition of done

A pull request is ready to merge when:

- [ ] Tests are added for new logic (write them first where you can) and `npm run test:coverage` passes
- [ ] `npm run typecheck`, `npm run lint` and `npm run build` pass; CI is green
- [ ] It works on `dev.protechrise.com` after merge (or locally against the dev API for pre-merge review)
- [ ] No dead links, no `console.log`, no hard-coded values that should come from the API or config
- [ ] Keyboard and screen-reader basics checked; layout checked at 360px and desktop widths
- [ ] The relevant docs are updated (README, runbook, comments where the "why" is not obvious)
- [ ] The linked issue's acceptance criteria are all ticked

## Conventions

- **Commits:** `type: description` where type is `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf` or `ci`.
- **Small files, small functions:** files under about 400 lines, functions under about 50 lines, early returns over deep nesting.
- **Immutability:** create new objects instead of mutating existing ones.
- **Validate at the edges:** everything from the API, the URL or a form is validated (Zod) before use. Never render unvalidated data.
- **Live data is live:** fees, deadlines, cohort status and track data come from the API at request time. Never bake them into static pages.
- **No secrets in the repo.** Use environment variables. Never use live Paystack keys outside production.
- **No tokens in URLs or logs.** Magic-link tokens and payment references must not reach analytics, Sentry or `Referer` headers.
- **Legal text is carried over verbatim** (privacy, refund policy) and changes only with sign-off. Policy pages carry a version line.
- **Do not copy third-party content.** `reference/` (gitignored) is study material only; ProTech copy, brand and assets only ship.

### Security-sensitive changes

Authentication, payments, user-input handling, database or file access and anything touching personal data need a
security review before merge. Mention it in the PR so a reviewer looks specifically at that code.

## Environments

| | URL | API | Notes |
|---|---|---|---|
| dev | `https://dev.protechrise.com` | dev waitlist-api (own database, test keys, email allow-list) | basic auth and `noindex`; deploys from `main` |
| staging | not yet for this app (`staging.protechrise.com` is the legacy site) | | see the staging issue |
| production | not yet (legacy site) | | see the cutover issues |

Ask the repo owner for the dev basic-auth password; never paste it into an issue or PR.

## Changes to waitlist-api

Some issues (`area:api`) change `OctoberCoder/tech-rise-academy`. Open the PR there and link it from the issue here. That repo
has its own rules: 95% coverage gate, Node built-in test runner, and **never deploy to production while an email run is in progress**.
