# Deploying to dev.protechrise.com

Status: DNS and Cloudflare Tunnel ingress for `dev.protechrise.com` and `dev-api.protechrise.com` already
exist (proxied CNAMEs to the shared tunnel, ingress to `localhost:80`). Nothing to add in Cloudflare DNS.
All work below happens in Coolify. Prod and staging must not be touched.

## 0. Before you start
- `dev.protechrise.com` currently serves the retired "Tech Rise Academy — Demo" app. This runbook replaces it.
- `dev-api.protechrise.com` currently serves a waitlist-api with no data. It was **not** verified to have an
  isolated database. Treat it as unsafe until step 1 confirms its own volume and test keys.

## 1. Dev waitlist-api (fresh, isolated)
Create a new application from `tech-rise-academy`, base directory `/waitlist-api` (same as staging), then:
1. Give it its **own** persistent volume mounted at `/data`. Never reuse the staging or prod volume.
2. Use Paystack **test** keys only, and set the email allowlist so no real applicant can be emailed.
3. Domain: either repoint `dev-api.protechrise.com` to this service (stop the old dev-api service first, do not
   delete it), or use a new hostname (needs a new CNAME and tunnel rule).
4. Verify: `curl https://dev-api.protechrise.com/api/health` returns ok, and the DB path differs from staging.

## 2. protechrise-web
1. New application, GitHub repo `OctoberCoder/protechrise-web`, branch `feat/scaffold` (until a `main` exists).
2. Build pack: Dockerfile, base directory `/`, port `3100`, health check path `/api/health`.
3. Runtime variable `API_ORIGIN=https://dev-api.protechrise.com`. It is read at runtime by the proxy (`src/proxy.ts`), so no
   build argument is needed and the image builds without it.
4. Runtime variables: `SITE_URL=https://dev.protechrise.com`, `DEV_NOINDEX=true`, `DEV_BASIC_AUTH_USER`, `DEV_BASIC_AUTH_PASS` (choose a strong password).
   Also `LMS_ORIGIN` (the dev LMS origin, the same value as the dev waitlist-api's `LMS_DASHBOARD_URL`, for example `https://learn-dev.protechrise.com`). Without it the "Open the LMS" buttons on `/portal` and `/status` are not offered, by design.
5. Stop (do not delete) the old demo service that owns `dev.protechrise.com`, then set this service's domain to
   `https://dev.protechrise.com` and deploy.

## 3. Verify from outside
```bash
curl -s https://dev.protechrise.com/api/health                 # {"ok":true,"service":"protechrise-web"}
curl -s -o /dev/null -w "%{http_code}\n" https://dev.protechrise.com/          # 401 without credentials
curl -sI -u "$USER:$PASS" https://dev.protechrise.com/ | grep -i x-robots      # noindex, nofollow
```
Rollback: restart the stopped demo service and point its domain back to `dev.protechrise.com`.

## 4. Optional: let automation drive Coolify (security change, owner-only)
`coolify.protechrise.com` is behind Cloudflare Access, so API calls get an SSO redirect. To let a script use the
Coolify API token, the account owner can add a Cloudflare Access **service token** and attach a "Service Auth"
policy to the Coolify application (Zero Trust, Access, Service Auth). Send the resulting
`CF-Access-Client-Id` and `CF-Access-Client-Secret` headers with each request, and keep both in the keychain.
Scope the policy to the Coolify application only, and rotate the token if it is ever exposed.
