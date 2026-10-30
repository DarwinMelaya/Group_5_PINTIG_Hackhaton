# DALUYAN

**Explore Marinduque. Share Your Journey. Shape Better Tourism.**

A responsive React tourism application with the six official modules: HOME, MAP, TOURISM AND CULTURE HUB, NOTIFICATIONS, RINI, and SETTINGS. Includes Supabase integration, SQL security policies, deterministic intelligence, and an MFA-protected administrator interface.

**Current status:** buildable development implementation with Supabase-backed authentication, persistent community actions, and PostgreSQL permissions. Configure the public Supabase URL and publishable browser key before running the application; the app does not provide a local or read-only preview fallback. See [implementation status](docs/IMPLEMENTATION_STATUS.md) and [test evidence](docs/TEST_RESULTS.md).

## Develop

Prerequisite: Node.js 22.12+ (tested with Node 24.19), npm 11, Chromium for browser tests.

```bash
cd /workspace/DALUYAN
npm ci
npm run dev -- --port 5173
```

Each cloud task is already isolated. Use this checkout; do not create a worktree unless explicitly requested. `npm run build` creates `dist`; `npm run preview` serves it for local validation. No paid APIs or LLM are required.

## Connect a free Supabase project

1. Create or select a Supabase free-tier project. Execute `supabase/migrations/202610290001_initial.sql`, `supabase/migrations/202610300001_registration_onboarding.sql`, and `supabase/migrations/202610300002_add_profile_avatar_columns.sql` in its SQL editor. If the initial schema is already installed, apply the two later migrations. Then execute `supabase/seed.sql`. The seed is repeatable and preserves existing IDs. Alternatively use the Supabase CLI with your own project configuration. Never run these against an unrelated database.
2. Set `VITE_SUPABASE_URL` and **only** the public publishable browser key (`VITE_SUPABASE_PUBLISHABLE_KEY`; the legacy `VITE_SUPABASE_ANON_KEY` is also supported) in a gitignored `.env.local` or injected development environment. `.env.example` contains names only. Restart Vite after changing them. Never put service-role keys, database passwords, Google client secrets or CAPTCHA secrets in `VITE_` variables.
3. In Supabase Auth enable email/password and turn **Confirm email** off if registration should create a session and log the user in immediately without an invitation or verification email. Set the site URL and allow development and deployed `/auth` callback URLs, including `/auth?mode=recovery`. For Google login, enable the Google provider and add its callback URL. The `new_profile` database trigger automatically creates the DALUYAN profile and tourist role for every email or OAuth user.
4. Enable TOTP in Auth → MFA. Ordinary users without an enrolled factor can use email/password. Enrolled users must challenge their authenticator before private operations; administrators require AAL2 for all privileged reads/writes. The app supports QR enrollment, initial verification, factor status, challenge, cancellation and authenticated factor removal. Test on real authenticator devices; do not share enrollment QR images.
5. Optional Google login: configure the Google provider and its callback in Supabase, with a free Google OAuth web client. The app's Google action uses Supabase OAuth and reports provider errors; after the first successful callback, the database trigger automatically creates the DALUYAN account. No Google secret belongs in this repository.
6. Deploy RINI's Edge Function and configure its server-only Gemini secret:

```bash
supabase functions deploy rini-chat
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
```

Never put `GEMINI_API_KEY` in `.env.local` or any `VITE_` variable. The function requires a signed-in Supabase user, reads published listings and consented preferences, and writes each exchange to `rini_conversations` and `rini_messages` under RLS. For server-verified anti-bot protection, configure Cloudflare Turnstile in **Supabase Auth → Bot and abuse protection** (site key and secret in their designated dashboards). Set the public `VITE_TURNSTILE_SITE_KEY`. Supabase verifies `captchaToken`; a frontend token alone is not treated as proof. Configure Auth rate limits. Database triggers independently throttle posts, listing requests, interactions and reports. Public storage requires further abuse monitoring for production.
7. Buckets and policies are created by the migration: `post-media` and `avatars` are public; `feedback-evidence` is private. Never make feedback evidence public. The migration adds activity events to the Supabase Realtime publication if present. Enable Realtime for that table if your project manages publications separately.
8. Register a real account first. Through the **trusted SQL editor only**, authorize the intended administrator by exact account ID:

```sql
update public.user_roles set role = 'admin' where user_id = '<verified-account-uuid>';
```

Do not derive authorization from editable metadata. Enroll and verify that account's TOTP before opening `/admin`. Promote business owners/contributors only through trusted administration; listing ownership is assigned after claim review. 9. Source-review destinations before automatic promotion. The seed contains six introductory, **unverified** destination references and eight **fictional** enterprise examples. No fees or contact details are invented. Review current sources, geographic coordinates, permission and destination readiness; enter evidence through administration. An empty automatic itinerary from unverified seed data is intentional. Algorithm tests use explicitly verified fixtures, not false production labels. 10. Test with two real tourists and an MFA-enabled administrator using the manual acceptance checklist. Successful local SQL tests do not establish actual hosted Auth, Storage, email, OAuth or Realtime health.

## Network requirements

Development dependencies: `registry.npmjs.org` plus the configured package-manager preset. Runtime/public sources: the specific `<project>.supabase.co` hostname (HTTPS and WSS), `api.open-meteo.com`, `*.tile.openstreetmap.org`, `www.pagasa.dost.gov.ph`, `marinduque.gov.ph`, `accreditation.tourism.gov.ph`, `en.wikipedia.org`. Optional CAPTCHA uses `challenges.cloudflare.com`; Google OAuth redirects through Google accounts. Proposal access requires `docs.google.com` and possibly Drive permissions. Add actual business contact hosts only as needed. Do not disable TLS or bypass the environment proxy.

## Verify

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
# Test compiled assets instead of the dev server (Linux/macOS):
DALUYAN_TEST_PRODUCTION=1 npm run test:e2e
```

The Playwright config uses `/usr/bin/chromium`, which exists in this cloud image. For other machines set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chromium path, or install the matching Playwright browser and adjust the config. Browser tests simulate unavailable third-party APIs to verify error states; they do not establish live provider connectivity. SQL tests run the actual migration in PGlite PostgreSQL with minimal Auth/Storage schema stubs, not a hosted Supabase instance.

## Deploy on Cloudflare Pages (free tier)

Connect this GitHub repository to a Pages project. Set the root directory to the repository root, build command `npm run build`, output `dist`, and Node version `24`. Set public `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or legacy `VITE_SUPABASE_ANON_KEY`), and optional Turnstile site key as build variables. These values are embedded at build time; rebuild after changing them. `_redirects` preserves client routes. `wrangler.toml` also supports a Pages deployment with your authorized Cloudflare account.

After deploying, add the actual HTTPS URL to Supabase Auth callbacks, open a deep link directly, verify mobile navigation on the deployed site, and run the two-tourist feedback/notification/admin workflow. No production URL or QR code is supplied here because deployment has not occurred. Do not generate a demo QR code pointing to an unverified or placeholder URL.

## Data and media

`src/data` includes destinations, enterprises, twelve fictional community fixtures, three simulated demand scenarios, and tourism FAQ records. `scripts/seed-data.py` regenerates these fixtures and six original landscape illustrations. Images are original SVG illustrations, **not actual location photographs**. Preserve labels and replace them only with appropriately licensed, permission-approved images. `supabase/seed.sql` contains listings only; it does not manufacture fake Supabase Auth accounts. Seed/community content is not automatically imported into connected feeds.

RINI is an explainable local lookup assistant, not a generative LLM. Congestion is always DEMO / SIMULATED. Itineraries are ranked suggestions, not road routing, exact ETAs or booking guarantees. Open-Meteo forecasts are separate from official PAGASA advisories.

## Documentation

- [Requirements matrix and phased plan](docs/REQUIREMENTS_MATRIX.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database and security](docs/DATABASE.md)
- [Implementation status and exact gaps](docs/IMPLEMENTATION_STATUS.md)
- [Actual test results and manual acceptance](docs/TEST_RESULTS.md)
