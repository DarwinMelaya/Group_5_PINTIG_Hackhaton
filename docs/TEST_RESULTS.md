# Actual test evidence

Latest source validation: **29 October 2026, 13:05 Asia/Manila**. These are local results. There is no hosted Supabase project or deployed HTTPS site under test.

| Command                            | Actual outcome                                                                                                      | Meaning                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bash scripts/install.sh`          | PASS: Node v24.19.0; frozen `npm ci` installed 207 packages; strict production build completed                      | Exact saved install instructions executed successfully. The script retains the lockfile and creates only dependencies/build outputs.                             |
| `npm test`                         | **47 passed, 0 failed, 0 skipped** in 2 files                                                                       | 26 intelligence tests and 21 actual PostgreSQL migration/permission tests under PGlite with Supabase schema stubs.                                               |
| `npm run build`                    | **PASS**, TypeScript + Vite 7.3.7; 2341 modules transformed                                                         | Production assets generated in `dist`; initial JS ~422 kB uncompressed / 132 kB gzip; map/analytics split into separate chunks. This is not proof of deployment. |
| `npm run test:e2e`                 | **5 passed, 0 failed, 0 skipped** in Chromium, 15.6 seconds                                                         | Functional guest/preview browser workflows; includes 390×844 mobile viewport and mocked third-party failure states.                                              |
| Production-bundle browser suite    | **PASS: 5 passed, 0 failed, 0 skipped in 9.0 seconds**, including final RINI widget and explicit backdrop dismissal | Runs the same acceptance checks against `vite preview`, not the development server.                                                                              |
| Hosted Supabase / deployed website | **UNRUN**                                                                                                           | Missing project configuration/deployment access. Do not count these as passed.                                                                                   |

## Intelligence coverage — 26 tests

Three scenario calculations; LOW/MODERATE/HIGH boundary values at 70% and 100%; zero capacity denominator; invalid negative/non-finite values and invalid service fractions; Filipino/English positive/negative/mixed/neutral and simple negation; no private-feedback/fictional-post contamination in sentiment; category suggestions; at least three eligible recommendations; exact required normalized weighting; unverified/private-promotion exclusions; eligible saved-place priority; actual municipality and moderation filtering; sourced RINI answers/unknown fees; real itinerary-route handoff with recognized duration; uncertain answers and no invented ferry operations.

## PostgreSQL security/integrity coverage — 21 tests

The actual migration is executed in PGlite PostgreSQL. Only Supabase-owned `auth`/`storage` schemas and JWT accessors are stubbed. Each actor uses the real `anon` or `authenticated` SQL role; RLS, grants, functions, constraints and triggers execute in PostgreSQL.

Passed: guest public reads/private-feedback isolation; guest insert rejection; cross-user edits blocked; AAL1 admin private updates denied; feedback owners cannot self-close reports; AAL2 admin updates emit recipient-only notifications; comment/reply notification persistence; replies to private feedback blocked; unique/toggle reactions and forged event rejection; private saves/itineraries; forged authors and unowned media blocked; private evidence and upload-folder ownership; user-editable authorization/verification rejected; accreditation requires evidence; reporting quarantines public content; mark-read restricted to recipients; burst-post database rate limit; enrolled tourists require MFA for private operations; review rating/uniqueness constraints; admin moderation of another author's owned photograph and audit retention after deletion; idempotent seed application.

Limits: these tests do **not** issue real Supabase JWTs or contact Auth, Storage object services, PostgREST, SMTP, OAuth providers or Realtime. Bucket SQL policies are tested; actual provider upload behavior and MFA QR/code exchange are unrun.

## Browser coverage — 5 acceptance tests

1. Guest HOME renders, Torrijos filter selects two actual fixture records, destination route opens, unknown fee and forecast failure are displayed.
2. MAP shows six places; Boac filter changes the list to one; Lenten simulation gives 154.7% utilization; editing additional visitors gives 128.0%; unverified records yield the explicit no-recommendation state.
3. RINI widget opens/closes accessibly; the RINI page returns a cited Boac record and connects the request to the real MAP itinerary dialog.
4. Hub category filters real records; fictional business profile has no invented contact; login controls are enabled; guest notifications prompt for login; admin route redirects to authentication.
5. Mobile drawer opens/navigates/highlights active route/closes after navigation, Escape and outside click; keyboard focus returns to its opener. HOME/MAP/HUB/RINI/SETTINGS/AUTH have no horizontal overflow at 390px. Screenshots were captured locally.

Weather calls are deliberately answered with HTTP 503 and OSM tile requests aborted in these tests. This proves fallback behavior, **not live weather or tile availability**. The last local screenshots are generated under ignored `test-results/desktop-detail.png` and `test-results/mobile-home.png`; they are not deployment screenshots. Real mobile device/screen-reader checks remain unrun.

## Defects found and corrected during validation

- Scenario preset names were mistakenly validated as numeric inputs; explicit numeric field validation fixed this.
- A NULL SQL CHECK allowed absent accreditation evidence; explicit null-safe checks fixed this.
- The mobile dialog did not restore focus without a Radix Trigger; explicit return-focus handling fixed this.
- Route transitions retained a previous feed scroll position; pathname-based scroll restoration fixed this.
- Admin moderation initially rechecked media against the admin rather than the original author; author-based ownership validation fixed this.
- Creation-rate accounting using AFTER events missed rows in a single multi-row insert; transactional BEFORE audit accounting fixed the bypass and retains logs after post deletion.

- Fast outside clicks could precede the dialog library listener; an explicit backdrop pointer handler fixed the race.

Final counts above reflect reruns after these fixes. No failing result is reclassified as a pass without rerunning the affected check.

## Required test categories 1–25

| #   | Category                 | Executed evidence / remaining acceptance                                                                               |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | Guest browsing           | PASS browser                                                                                                           |
| 2   | Registration/login       | Login and registration controls enabled; real provider flow UNRUN                                                     |
| 3   | Session persistence      | SDK configured; real reload/logout/token refresh UNRUN                                                                 |
| 4   | MFA enrollment/challenge | SQL assurance checks PASS; authenticator flow UNRUN                                                                    |
| 5   | Protected routes         | Guest browser redirect and SQL role/AAL checks PASS; hosted admin UI UNRUN                                             |
| 6   | Post creation            | SQL permissions/rate limits PASS; hosted composer persistence UNRUN                                                    |
| 7   | Image uploads            | SQL storage/ownership PASS; hosted upload/compression integration UNRUN                                                |
| 8   | Reviews                  | SQL rating/uniqueness and sentiment PASS; live review UI UNRUN                                                         |
| 9   | Comments                 | SQL parent/privacy/notification PASS; two-user browser UNRUN                                                           |
| 10  | Reactions                | SQL toggle/uniqueness PASS; hosted browser integration UNRUN                                                           |
| 11  | Notifications            | SQL recipient/read/event persistence PASS; hosted Realtime UNRUN                                                       |
| 12  | Map markers              | Marker/list rendering observed in browser; live tile loading UNRUN                                                     |
| 13  | Municipality filtering   | PASS algorithms and browser                                                                                            |
| 14  | Congestion               | PASS boundaries, presets and browser recalculation                                                                     |
| 15  | Itinerary generation     | PASS weighted ≥3-stop verified fixtures; browser source-eligibility empty state; hosted save/reorder persistence UNRUN |
| 16  | Marketplace              | PASS guest search/category/details; owner hosted UI UNRUN                                                              |
| 17  | Verification permissions | PASS SQL protected role/evidence/AAL2; live admin review UNRUN                                                         |
| 18  | External links           | Source link and missing-contact behavior PASS browser; real business-contact availability UNRUN                        |
| 19  | Feedback                 | SQL private ownership/status PASS; hosted form/evidence UNRUN                                                          |
| 20  | Administrator updates    | SQL AAL2 status/event persistence PASS; hosted browser UNRUN                                                           |
| 21  | RINI                     | PASS deterministic lookup, uncertainty, sources and browser handoff                                                    |
| 22  | Weather API failure      | PASS browser injected failure; live success UNRUN                                                                      |
| 23  | Mobile responsiveness    | PASS 390×844 Chromium viewport/drawer/overflow; real devices UNRUN                                                     |
| 24  | Unauthorized operations  | PASS actual PostgreSQL roles/RLS under schema stubs; hosted REST attacks UNRUN                                         |
| 25  | Build/deployment         | Build PASS; Cloudflare deployment, real HTTPS and production mobile UNRUN                                              |

## Manual live acceptance checklist (unrun)

Use the intended development Supabase project, two real tourists A/B, and an administrator with a trusted role and enrolled TOTP. Preserve test account separation with separate browser contexts. Never enter secrets into test reports.

- [ ] Apply migration/seed and confirm exposed tables have RLS; verify private buckets and notification recipient policies via actual REST/storage requests.
- [ ] Register A and B, verify email, log in, reload to confirm sessions, reset a password, log out and check session revocation. Test invalid credentials and Auth CAPTCHA rejection server-side.
- [ ] Enroll TOTP, verify the initial code, sign out/in, require challenge, reject invalid/expired codes, verify AAL2. Check cancel/remove/recovery guidance. An AAL1 administrator must not read private reports or mutate verification.
- [ ] Approve sufficiently sourced/public-ready destinations, record checked dates, unknown/known fees and media permission. Confirm at least three eligible destinations exist for a matching itinerary.
- [ ] Complete public phone-browser HOME→MAP→destination→Holy Week simulation→interest/budget itinerary; reorder/remove/save/reload stops and verify the saved order. Check all eight filters and marker layers with real review sample sizes.
- [ ] Add a real reviewed enterprise/contact. Check the actual external channel, services/amenities/address and evidence status. Ordinary users/owners must not self-grant accreditation or take over another business.
- [ ] A uploads 1–3 compressed images, previews/publishes/edits/deletes owned content and submits a destination/business review. Reject fourth/invalid/oversized files. B must not edit A's data.
- [ ] B comments/replies/reacts; A receives a recipient-only Realtime notification, opens related content, and marks one/all read. A third user must not see private updates. Reported posts leave recommendations until moderation.
- [ ] RINI cites reviewed records, passes recognized trip preferences to MAP, labels unknown fees and refuses unsupported official schedule/weather claims.
- [ ] A submits private feedback/evidence; B and guest cannot read it or its signed objects. Admin updates each workflow status; A sees the persisted change and receives notification. Check analytics exclude personal identifiers/public disclosure.
- [ ] Publish an administrator announcement; verify public feed and recipient notification delivery. Review/withdraw a registered source; check audit behavior.
- [ ] Deploy on Cloudflare Pages, configure real Auth redirect origins, load all deep routes over HTTPS, test mobile browsers and the entire specified 16-step multi-user scenario. Generate a QR code only after confirming the final URL.
- [ ] Re-read the supplied primary proposal and reconcile all requirements before declaring completion.
