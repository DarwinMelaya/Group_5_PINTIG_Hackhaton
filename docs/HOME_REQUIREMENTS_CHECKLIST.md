# DALUYAN Home/community requirements audit

Audit date: 2026-10-30. This is a code-level audit; hosted Supabase behavior and two-account workflows require live credentials and a browser session.

| Area | Status | Evidence / limitation |
| --- | --- | --- |
| Municipality navigation and filtering | Implemented and tested | Six-town controls and feed filtering are in `src/features/Home.tsx`; existing browser tests cover town selection. |
| Feed ranking and latest sort | Implemented and tested | `rankFeed` is used by Home; unit coverage exists in `tests/intelligence.test.ts`. |
| Authenticated post composer | Implemented but not tested against Supabase | Caption, municipality, destination/enterprise tagging, image limit, compression, and persistence are wired; live auth/storage is required. |
| Image preview/removal | Implemented | Selected files can be previewed and removed before publish. |
| Multi-image carousel | Implemented | Added keyboard arrows, touch swipe, counter, dots, lazy loading, and broken-image fallback in `Home.tsx`; live browser validation remains pending. |
| Likes/appreciations | Implemented but not tested against Supabase | Existing RPC interaction is wired with persisted events; optimistic rollback and two-account verification remain outstanding. |
| Comments and replies | Partially implemented | Persistent nested comments exist; compact comment drawer, pagination, editing, deletion, and reporting UX need further work. |
| Share links | Implemented but not tested against Supabase | Native share or clipboard fallback creates `/posts/:id`; live cancellation and permission cases remain unverified. |
| Saved posts and places | Implemented but not tested against Supabase | Existing private `saved_items` flow is wired; live persistence remains unverified. |
| Post edit/delete/report | Implemented but not tested against Supabase | Controls and ownership checks exist; live authorization and media retention need verification. |
| Public profiles | Partially implemented | Public posts render and the profile avatar lookup now uses the post author’s profile; tabs, bio, counts, and saved-content view are missing. |
| Notifications | Implemented but not tested against Supabase | Notification page and recipient-only read RPC exist; two-account delivery testing is pending. |
| RINI/tourism integration | Implemented but not tested against Supabase | Existing routes and source-grounded tourism context remain in place. |
| Enterprise media approval | Implemented but not deployed | Schema, bucket policies, upload helper, approval filtering, and Realtime migration are local in `202610300003_enterprise_media.sql`; hosted migration is not applied. |
| Real enterprise photographs | Missing | No approved owner/rightsholder photographs are currently available; placeholders remain intentional. |
| End-to-end browser acceptance | Blocked | No browser page or live authenticated test accounts were available for this audit. |

## Validation run

- `npm run typecheck`: passed
- `npm test`: passed, 47/47 tests
- `npm run build`: passed, with the existing large-chunk warning
- `npm run test:e2e`: not run in this audit because no browser session was available
