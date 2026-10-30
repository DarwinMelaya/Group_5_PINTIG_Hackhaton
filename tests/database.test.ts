import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const a = "40000000-0000-4000-8000-000000000001",
  b = "40000000-0000-4000-8000-000000000002",
  admin = "40000000-0000-4000-8000-000000000003",
  listing = "10000000-0000-4000-8000-000000000001",
  post = "30000000-0000-4000-8000-000000000001",
  feedback = "30000000-0000-4000-8000-000000000002";
async function asUser(id: string | null, sql: string, aal = "aal1") {
  try {
    const r = await db.exec(
      `begin; set local role ${id ? "authenticated" : "anon"};select set_config('request.jwt.claim.sub','${id ?? ""}',true);select set_config('request.jwt.claims','{"aal":"${aal}"}',true);${sql};commit;`,
    );
    return r[r.length - 2];
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create table auth.mfa_factors(user_id uuid,status text,factor_type text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 create function storage.foldername(name text) returns text[] language sql as $$select string_to_array(name,'/')$$;
 alter table storage.objects enable row level security;grant usage on schema public,auth,storage to anon,authenticated;grant select,insert,delete on storage.objects to anon,authenticated;`);
  const sql = readFileSync(
    "supabase/migrations/202610290001_initial.sql",
    "utf8",
  ).replace("create extension if not exists pgcrypto;", "");
  await db.exec(sql);
  await db.exec(
    `insert into auth.users(id) values('${a}'),('${b}'),('${admin}');update public.user_roles set role='admin' where user_id='${admin}';insert into listings(id,name,listing_type,municipality,description,moderation_status) values('${listing}','Test destination','destination','Boac','A test destination only','published');insert into posts(id,author_id,listing_id,post_type,body,municipality) values('${post}','${a}','${listing}','social','A public test post','Boac');insert into posts(id,author_id,post_type,body,municipality,feedback_status,moderation_status) values('${feedback}','${a}','feedback','Private safety concern','Boac','Received','pending');`,
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe("actual PostgreSQL RLS and trigger enforcement with Supabase auth/storage stubs", () => {
  it("allows guest public browsing and hides private feedback", async () => {
    const r = await asUser(null, "select id from posts");
    expect(r.rows).toHaveLength(1);
  });
  it("blocks guest publishing", async () =>
    await expect(
      asUser(
        null,
        `insert into posts(author_id,post_type,body,municipality) values('${a}','social','unauthorized','Boac')`,
      ),
    ).rejects.toThrow());
  it("prevents another tourist editing an owned post", async () => {
    await asUser(b, `update posts set body='attacker' where id='${post}'`);
    const r = await db.query<{ body: string }>(
      `select body from posts where id='${post}'`,
    );
    expect(r.rows[0].body).toBe("A public test post");
  });
  it("does not authorize administrators at AAL1", async () => {
    await asUser(
      admin,
      `update posts set feedback_status='Closed' where id='${feedback}'`,
    );
    const r = await db.query<{ feedback_status: string }>(
      `select feedback_status from posts where id='${feedback}'`,
    );
    expect(r.rows[0].feedback_status).toBe("Received");
  });
  it("blocks owner from changing feedback status", async () =>
    await expect(
      asUser(
        a,
        `update posts set feedback_status='Closed' where id='${feedback}'`,
      ),
    ).rejects.toThrow("Protected post fields"));
  it("allows AAL2 admin status updates and emits a private notification", async () => {
    await asUser(
      admin,
      `update posts set feedback_status='Under Review' where id='${feedback}'`,
      "aal2",
    );
    const own = await asUser(
      a,
      "select * from activity_events where event_type='feedback_update'",
    );
    expect(own.rows).toHaveLength(1);
    const other = await asUser(
      b,
      "select * from activity_events where event_type='feedback_update'",
    );
    expect(other.rows).toHaveLength(0);
  });
  it("supports persistent comments and recipient notifications", async () => {
    await asUser(
      b,
      `insert into posts(author_id,post_type,parent_id,body,municipality) values('${b}','comment','${post}','A helpful reply','Boac')`,
    );
    const r = await asUser(
      a,
      "select * from activity_events where event_type='notification'",
    );
    expect(r.rows).toHaveLength(1);
  });
  it("blocks replies to private feedback", async () =>
    await expect(
      asUser(
        b,
        `insert into posts(author_id,post_type,parent_id,body,municipality) values('${b}','comment','${feedback}','leak','Boac')`,
      ),
    ).rejects.toThrow("Cannot reply"));
  it("toggles unique reactions and prevents forged events", async () => {
    await asUser(b, `select interact('${post}','reaction','')`);
    let r = await asUser(
      null,
      "select * from activity_events where event_type='reaction'",
    );
    expect(r.rows).toHaveLength(1);
    await asUser(b, `select interact('${post}','reaction','')`);
    r = await asUser(
      null,
      "select * from activity_events where event_type='reaction'",
    );
    expect(r.rows).toHaveLength(0);
    await expect(
      asUser(
        b,
        `insert into activity_events(event_type,recipient_id) values('notification','${a}')`,
      ),
    ).rejects.toThrow();
  });
  it("preserves private saves and itineraries", async () => {
    await asUser(
      a,
      `insert into saved_items(user_id,listing_id) values('${a}','${listing}');insert into itineraries(user_id,name,stops) values('${a}','Trip',array['${listing}'::uuid])`,
    );
    expect((await asUser(b, "select * from saved_items")).rows).toHaveLength(0);
    expect((await asUser(b, "select * from itineraries")).rows).toHaveLength(0);
  });
  it("rejects forged author/media ownership", async () => {
    await expect(
      asUser(
        b,
        `insert into posts(author_id,post_type,body,municipality) values('${a}','social','forged','Boac')`,
      ),
    ).rejects.toThrow("Author mismatch");
    await expect(
      asUser(
        b,
        `insert into posts(author_id,post_type,body,municipality,media_urls) values('${b}','social','stolen','Boac',array['https://example.com/image.jpg'])`,
      ),
    ).rejects.toThrow("Media must belong");
  });
  it("protects private evidence and enforces storage upload folders", async () => {
    await asUser(
      a,
      `insert into storage.objects(bucket_id,name) values('feedback-evidence','${a}/proof.webp')`,
    );
    expect(
      (
        await asUser(
          b,
          "select * from storage.objects where bucket_id='feedback-evidence'",
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(
          admin,
          "select * from storage.objects where bucket_id='feedback-evidence'",
          "aal2",
        )
      ).rows,
    ).toHaveLength(1);
    await expect(
      asUser(
        b,
        `insert into storage.objects(bucket_id,name) values('post-media','${a}/stolen.webp')`,
      ),
    ).rejects.toThrow();
  });
  it("does not trust self-declared verification or admin roles", async () => {
    await expect(
      asUser(b, `update user_roles set role='admin' where user_id='${b}'`),
    ).rejects.toThrow();
    await asUser(
      b,
      `insert into listings(owner_id,name,listing_type,municipality,description,moderation_status,accreditation_status,metadata) values('${b}','Business test','enterprise','Boac','Business example for permission tests','published','Platform reviewed','{"verified":true}')`,
    );
    const r = await db.query<{
      moderation_status: string;
      accreditation_status: string;
      metadata: { verified: boolean };
    }>(`select * from listings where owner_id='${b}'`);
    expect(r.rows[0].moderation_status).toBe("pending");
    expect(r.rows[0].accreditation_status).toBe("Unverified");
    expect(r.rows[0].metadata.verified).toBe(false);
  });
  it("requires evidence for official DOT accreditation", async () =>
    await expect(
      asUser(
        admin,
        `update listings set accreditation_status='Official DOT accreditation verified' where id='${listing}'`,
        "aal2",
      ),
    ).rejects.toThrow());
  it("quarantines reported content without granting arbitrary moderation", async () => {
    await asUser(
      b,
      `select interact('${post}','report','Misleading information')`,
    );
    expect(
      (await asUser(null, `select * from posts where id='${post}'`)).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(a, `select * from posts where id='${post}'`)).rows,
    ).toHaveLength(1);
  });
  it("only marks the recipient notifications as read", async () => {
    await asUser(b, "select mark_notifications_read(null)");
    const before = await asUser(
      a,
      "select * from activity_events where recipient_id=auth.uid() and read_at is null",
    );
    expect(before.rows.length).toBeGreaterThan(0);
    await asUser(a, "select mark_notifications_read(null)");
    expect(
      (
        await asUser(
          a,
          "select * from activity_events where recipient_id=auth.uid() and read_at is null",
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("rate limits burst publishing on the database", async () => {
    await expect(
      asUser(
        a,
        `insert into posts(author_id,post_type,body,municipality) select '${a}','social','burst','Boac' from generate_series(1,6)`,
      ),
    ).rejects.toThrow("Too many submissions");
  });
  it("requires enrolled tourists to complete MFA before private operations", async () => {
    await db.exec(
      `insert into auth.mfa_factors values('${a}','verified','totp')`,
    );
    expect(
      (await asUser(a, `select * from posts where id='${feedback}'`)).rows,
    ).toHaveLength(0);
    await expect(
      asUser(
        a,
        `insert into saved_items(user_id,post_id) values('${a}','${post}')`,
      ),
    ).rejects.toThrow();
    expect(
      (await asUser(a, `select * from posts where id='${feedback}'`, "aal2"))
        .rows,
    ).toHaveLength(1);
    await db.exec("delete from auth.mfa_factors");
  });
  it("validates review ratings and uniqueness", async () => {
    await asUser(
      b,
      `insert into posts(author_id,listing_id,post_type,body,municipality,rating) values('${b}','${listing}','review','A review with a source context','Boac',4)`,
    );
    await expect(
      asUser(
        b,
        `insert into posts(author_id,listing_id,post_type,body,municipality,rating) values('${b}','${listing}','review','Duplicate','Boac',5)`,
      ),
    ).rejects.toThrow();
    await expect(
      asUser(
        a,
        `insert into posts(author_id,listing_id,post_type,body,municipality,rating) values('${a}','${listing}','review','Invalid','Boac',6)`,
      ),
    ).rejects.toThrow();
  });
  it("allows an admin to moderate a different author’s owned photograph", async () => {
    await asUser(
      a,
      `insert into storage.objects(bucket_id,name) values('post-media','${a}/own.webp')`,
    );
    const id = "30000000-0000-4000-8000-000000000099";
    await asUser(
      a,
      `insert into posts(id,author_id,post_type,body,municipality,media_urls) values('${id}','${a}','social','Photographic test','Boac',array['https://test.supabase.co/storage/v1/object/public/post-media/${a}/own.webp'])`,
    );
    await asUser(
      admin,
      `update posts set moderation_status='pending' where id='${id}'`,
      "aal2",
    );
    expect(
      (await asUser(null, `select * from posts where id='${id}'`)).rows,
    ).toHaveLength(0);
    await asUser(a, `delete from posts where id='${id}'`);
    const audit = await db.query(
      `select * from activity_events where payload->>'post_id'='${id}'`,
    );
    expect(audit.rows.length).toBeGreaterThan(0);
  });
  it("applies the listing seed repeatedly without overwriting existing records", async () => {
    const seed = readFileSync("supabase/seed.sql", "utf8");
    await db.exec(seed);
    const before = await db.query("select count(*) as n from listings");
    await db.exec(seed);
    const after = await db.query("select count(*) as n from listings");
    expect(after.rows).toEqual(before.rows);
  });
});
