#!/usr/bin/env node
// Records real responses from a waitlist-api into tests/fixtures/api/*.json so the contract tests
// (tests/api/contract.test.ts) check our schemas against what the API actually sends.
//
//   node scripts/record-api-fixtures.mjs https://dev-api.protechrise.com
//
// Safe by design: only GETs and POSTs with deliberately invalid or empty payloads that the API rejects, so
// no data is created or changed and no email is sent. Run it against the DEV API, never production.
// Re-run it when the API changes, review the diff, and commit the updated fixtures.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const origin = (process.argv[2] ?? process.env.API_ORIGIN ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(origin)) {
  console.error("Usage: node scripts/record-api-fixtures.mjs <api-origin>   (the dev API, for example https://dev-api.protechrise.com)");
  process.exit(1);
}
if (/^https:\/\/(www\.)?protechrise\.com$/.test(origin)) {
  console.error("Refusing to record against production.");
  process.exit(1);
}

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../tests/fixtures/api");

const CASES = [
  // [fixture name, method, path, JSON body]
  ["tracks", "GET", "/api/tracks"],
  ["public-fee", "GET", "/api/public-fee"],
  ["check-email-invalid", "GET", "/api/applications/check-email?email=not-an-email"],
  ["check-email-ok", "GET", "/api/applications/check-email?email=fixture.recorder@tasksystems.com"],
  ["applications-empty", "POST", "/api/applications", {}],
  ["waitlist-empty", "POST", "/api/waitlist", {}],
  ["status-request-link-invalid", "POST", "/api/status/request-link", { email: "not-an-email" }],
  ["status-me-anonymous", "GET", "/api/status/me"],
  ["status-logout", "POST", "/api/status/logout", {}],
  ["status-track-change-anonymous", "POST", "/api/status/track-change", { requestedTrack: "x" }],
  ["claim-start-info-bogus", "GET", "/api/claim/start-info?token=bogus"],
  ["claim-accept-bogus", "POST", "/api/claim/accept", { token: "bogus", accepted: true }],
  ["claim-confirmed-unknown", "GET", "/api/claim/confirmed?ref=bogus-reference"],
  ["referrer-apply-empty", "POST", "/api/referrer/apply", {}],
  ["referrer-request-link-invalid", "POST", "/api/referrer/request-link", { email: "not-an-email" }],
  ["referrer-me-anonymous", "GET", "/api/referrer/me"],
  ["referrer-logout", "POST", "/api/referrer/logout", {}],
  ["portal-state-anonymous", "GET", "/api/portal/state"],
  ["portal-home-anonymous", "GET", "/api/portal/home"],
];

// Signed-in portal recordings (issue #141). Sign in on the dev site, copy the applicant session cookie from the
// browser, and pass it through the environment only. It is sent as a Cookie header and is never printed or written.
//   PORTAL_SESSION_COOKIE='name=value' PORTAL_LABEL=eligible node scripts/record-api-fixtures.mjs <dev-api>
// Writes portal-home-<label>.json and portal-state-<label>.json (GET only, nothing is changed). Run it once per state.
const cookie = process.env.PORTAL_SESSION_COOKIE ?? "";
const label = (process.env.PORTAL_LABEL ?? "").trim();
if (cookie && !/^[a-z0-9-]{1,40}$/.test(label)) {
  console.error("Set PORTAL_LABEL (lowercase letters, digits, dashes) with PORTAL_SESSION_COOKIE, for example eligible or stuck.");
  process.exit(1);
}
if (/[\r\n]/.test(cookie)) {
  console.error("PORTAL_SESSION_COOKIE must be a single line.");
  process.exit(1);
}
if (cookie) {
  CASES.length = 0; // signed-in mode records only the portal calls below
  CASES.push([`portal-home-${label}`, "GET", "/api/portal/home"], [`portal-state-${label}`, "GET", "/api/portal/state"]);
}

await mkdir(OUT, { recursive: true });
let failures = 0;
for (const [name, method, apiPath, body] of CASES) {
  try {
    const res = await fetch(`${origin}${apiPath}`, {
      method,
      headers: { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { _nonJson: text.slice(0, 200) };
    }
    const fixture = { request: { method, path: apiPath, ...(body === undefined ? {} : { body }) }, status: res.status, body: json };
    await writeFile(path.join(OUT, `${name}.json`), `${JSON.stringify(fixture, null, 2)}\n`);
    console.log(`${String(res.status).padEnd(4)} ${name}`);
    await new Promise((r) => setTimeout(r, 400)); // be gentle with the API's rate limits
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : error}`);
  }
}
process.exit(failures ? 1 : 0);
