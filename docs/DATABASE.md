# Database and security

Apply `supabase/migrations/202610290001_initial.sql` to a **Supabase PostgreSQL project**. It expects Supabase-managed `auth` and `storage` schemas and the `anon`/`authenticated` roles. `supabase/seed.sql` is idempotent, inserts listings only, and creates no fake login identities.

## Core entities

| Table           | Relationships and purpose                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| profiles        | Primary key → auth.users. Public display name/avatar only; own updates. No passwords.                                                                                                                                             |
| listings        | owner_id → profiles; destinations, enterprises, approved heritage; municipality/fees/contact/source/moderation data; typed metadata and evidence checks.                                                                          |
| posts           | author → profiles, listing → listings, parent → posts. Social/review/comment/feedback/announcement types. Review ratings 1–5 with one review per user/place; comment requires parent; only feedback has feedback_status.          |
| activity_events | actor/recipient → profiles, post/listing references. Server-constructed reactions, private notifications, reports, status changes, simulations and audit events. Post deletion preserves event history with null post references. |

## Minimum normalized additions

| Table               | Why separate from the four-table MVP                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| user_roles          | Trusted authorization must not use user-editable public profiles/metadata. Role writes are unavailable to browser users. |
| saved_items         | Unique user/place or user/post saves; prevents JSON/event duplication and isolates private ownership.                    |
| itineraries         | Private ordered stop IDs and preferences, with size/name constraints; suitable for retrieving/reordering saved trips.    |
| information_sources | Approved/rejected source references with review timestamps; separates source governance from social content.             |

An ordered itinerary UUID array is bounded to 20 stops; it does not currently enforce a foreign key per array element. The UI omits missing places on restore. A future stop junction table can provide stronger per-stop referential integrity if needed.

## Database invariants

Foreign keys, municipality/type/status constraints, review uniqueness, rating range, source evidence requirements, media count and metadata-shape checks, and feed/listing/parent/event indexes are in the migration. Unknown fees remain null. Official accreditation requires a nonempty HTTPS evidence reference; only AAL2 administrators can change verification. This enforces evidence presence, **not independent proof of its authority**; the human reviewer must check it.

Security-definer functions use fixed `search_path`. Exposed function grants are limited to `is_admin`, `has_account_access`, authenticated `interact` and `mark_notifications_read`. Browser users cannot directly create/alter audit or notification events. Notification recipients and related links are derived server-side. A report causes a nested server trigger to move public content into pending moderation; owner updates cannot set arbitrary moderation status. Listing and post moderation/status mutations record audit information. Account role assignment/recovery remains a trusted server/SQL-editor operation.

`has_account_access` requires an authenticated user and AAL2 when that user has a verified TOTP factor. `is_admin` additionally requires the protected admin role and AAL2. Enrolled AAL1 sessions can continue guest browsing; private reads and writes are denied until the challenge succeeds.

Server post limits use transaction advisory locks and immutable creation audit rows (5/minute); rejected statements roll back the audit insertion. Listing requests are limited to 5/hour; reports to 10/hour; event interactions to 20/minute. This is lightweight protection, not a complete abuse-prevention service. Configure Supabase Auth rate limits and server-verified CAPTCHA separately. Upload quotas and orphan-file cleanup require production monitoring.

## RLS overview

| Data                         | Guest                           | Owner / recipient                                    | AAL2 admin                                   |
| ---------------------------- | ------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| Public profiles              | Read                            | Update own                                           | No general profile overwrite                 |
| Published listings           | Read                            | Edit authorized basic data; changes return to review | Manage/review/assign owners                  |
| Published non-feedback posts | Read                            | Create/update/delete owned permitted fields          | Moderate and publish announcements           |
| Feedback / unpublished posts | Denied                          | Own records after required MFA                       | Read/manage                                  |
| Reactions                    | Read for available public posts | Toggle using validated RPC                           | Read                                         |
| Notifications                | Denied                          | Recipient-only; mark own read using RPC              | Review where needed                          |
| Post reports/audit           | Denied                          | Own submitted reports only                           | Review                                       |
| Saved items / itineraries    | Denied                          | Owner-only                                           | No blanket access to tourists' private plans |
| Approved sources             | Read                            | No changes                                           | Manage                                       |

## Storage

- `post-media`: public; 5 MiB/object; JPEG/PNG/WebP.
- `avatars`: public; 2 MiB/object; JPEG/PNG/WebP.
- `feedback-evidence`: private; 5 MiB/object; JPEG/PNG/WebP; owner and AAL2 admin reads only.
- Authenticated inserts/deletes require the first folder to equal the JWT subject and satisfy any enrolled MFA.
- Client images are decoded and recompressed to WebP with maximum 1600-pixel dimensions. File type and input size are checked before processing. Posts validate object existence and submitting-author ownership. Signed evidence URLs expire in 60 seconds.
- Bucket MIME/size rules and ownership policies do not provide malware scanning or authoritative byte-level content inspection. SVG uploads are disallowed. Orphaned uploads after failed publishing may need cleanup.

The migration subscribes `activity_events` to `supabase_realtime` when that publication exists. Client subscriptions filter recipient IDs; RLS remains the authorization boundary. Hosted replication, email/OAuth/MFA providers, object-service behavior and actual JWT issuance are not validated by PGlite.

TypeScript domain models are in `src/lib/types.ts`; SDK data enters through the store boundary. Regenerate exact project types with `supabase gen types typescript` after applying the schema for future schema evolution. Do not use generated browser types as a substitute for RLS.
