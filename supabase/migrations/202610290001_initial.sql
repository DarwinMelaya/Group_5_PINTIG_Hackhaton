-- DALUYAN: apply through Supabase SQL editor / CLI. No browser service-role key.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 80),
 avatar_url text, display_role text, created_at timestamptz not null default now()
);
create table public.user_roles (
 user_id uuid primary key references auth.users on delete cascade,
 role text not null check(role in ('tourist','business_owner','heritage_contributor','admin')) default 'tourist'
);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from user_roles where user_id=auth.uid() and role='admin') and coalesce(auth.jwt()->>'aal','')='aal2' $$;
create function public.has_account_access() returns boolean language sql stable security definer set search_path=public
as $$ select auth.uid() is not null and (coalesce(auth.jwt()->>'aal','')='aal2' or not exists(select 1 from auth.mfa_factors where user_id=auth.uid() and status='verified' and factor_type='totp')) $$;
create table public.listings (
 id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles,
 name text not null check(char_length(name) between 2 and 160), listing_type text not null check(listing_type in ('destination','enterprise','heritage')),
 municipality text not null check(municipality in ('Boac','Mogpog','Gasan','Buenavista','Santa Cruz','Torrijos')),
 description text not null check(char_length(description) between 10 and 10000), latitude double precision check(latitude between -90 and 90), longitude double precision check(longitude between -180 and 180),
 fee_min numeric check(fee_min>=0), fee_max numeric check(fee_max>=fee_min), fee_status text not null default 'unverified' check(fee_status in ('unverified','estimated','verified')),
 fee_source_url text check(fee_source_url is null or fee_source_url like 'https://%'), contact_links jsonb not null default '{}',
 accreditation_status text not null default 'Unverified' check(accreditation_status in ('Unverified','Documents submitted','Platform reviewed','Official DOT accreditation verified')),
 source_url text check(source_url is null or source_url like 'https://%'), metadata jsonb not null default '{"category":"Other tourism enterprises","activities":[],"image":"/landscape-1.svg","source_label":"UNVERIFIED","last_checked":null,"verified":false,"public_promotion":false,"community_benefit":0,"capacity":100,"baseline":0}',
 moderation_status text not null default 'pending' check(moderation_status in ('published','pending','rejected')), created_at timestamptz not null default now(),
 check(fee_status<>'verified' or (fee_source_url is not null and fee_min is not null)),
 check(jsonb_typeof(metadata)='object' and coalesce(jsonb_typeof(metadata->'activities')='array',false) and coalesce(jsonb_typeof(metadata->'verified')='boolean',false) and coalesce(jsonb_typeof(metadata->'public_promotion')='boolean',false) and coalesce(jsonb_typeof(metadata->'baseline')='number',false) and coalesce(jsonb_typeof(metadata->'capacity')='number',false) and coalesce(jsonb_typeof(metadata->'category')='string',false) and coalesce(jsonb_typeof(metadata->'image')='string',false)),
 check(not jsonb_path_exists(metadata, '$.activities[*] ? (@.type() != "string")')),
 check(coalesce(jsonb_typeof(metadata->'services')='array',true) and coalesce(jsonb_typeof(metadata->'amenities')='array',true) and coalesce(jsonb_typeof(metadata->'address')='string',true)),
 check(not jsonb_path_exists(metadata, '$.services[*] ? (@.type() != "string")') and not jsonb_path_exists(metadata, '$.amenities[*] ? (@.type() != "string")')),
 check((metadata->>'baseline')::numeric>=0 and (metadata->>'capacity')::numeric>=0),
 check(not coalesce((metadata->>'verified')::boolean,false) or (source_url is not null and metadata->>'last_checked' is not null)),
 check(accreditation_status<>'Official DOT accreditation verified' or coalesce((metadata->>'accreditation_evidence_url') like 'https://%',false))
);
create table public.posts (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles on delete cascade,
 listing_id uuid references public.listings on delete set null, parent_id uuid references public.posts on delete cascade,
 post_type text not null check(post_type in ('social','review','comment','feedback','announcement')),
 body text not null check(char_length(body) between 1 and 5000), rating smallint check(rating between 1 and 5), media_urls text[] not null default '{}',
 sentiment_label text not null default 'Neutral', moderation_status text not null default 'published' check(moderation_status in ('published','pending','rejected')),
 municipality text not null check(municipality in ('Boac','Mogpog','Gasan','Buenavista','Santa Cruz','Torrijos')),
 category text check(category in ('Cleanliness','Pricing','Transport','Accessibility','Safety','Facilities','Satisfaction','Tourist experience')),
 feedback_status text check(feedback_status in ('Received','Under Review','Action Noted','Closed')),
 created_at timestamptz not null default now(),
 check(cardinality(media_urls)<=3), check((post_type='review' and rating is not null and listing_id is not null) or (post_type<>'review' and rating is null)),
 check((post_type='comment')=(parent_id is not null)), check((post_type='feedback')=(feedback_status is not null))
);
create unique index one_review_per_listing on public.posts(author_id,listing_id) where post_type='review';
create table public.activity_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles on delete set null, recipient_id uuid references public.profiles on delete cascade,
 listing_id uuid references public.listings on delete set null, post_id uuid references public.posts on delete set null,
 event_type text not null check(event_type in ('reaction','notification','report','feedback_update','moderation','business_review','simulation','audit')),
 payload jsonb not null default '{}', is_simulated boolean not null default false, source_url text, created_at timestamptz not null default now(), read_at timestamptz
);
create unique index unique_reaction on public.activity_events(actor_id,post_id) where event_type='reaction';
create table public.saved_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 listing_id uuid references public.listings on delete cascade, post_id uuid references public.posts on delete cascade,
 check(num_nonnulls(listing_id,post_id)=1), unique(user_id,listing_id), unique(user_id,post_id)
);
create table public.itineraries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles on delete cascade,
 name text not null check(char_length(name) between 1 and 100), stops uuid[] not null, preferences jsonb not null default '{}', created_at timestamptz not null default now(), check(cardinality(stops) between 1 and 20)
);
create table public.information_sources (
 id uuid primary key default gen_random_uuid(), title text not null, url text not null check(url like 'https://%'), last_checked timestamptz, approved boolean not null default false
);
create index listings_filters on public.listings(moderation_status,municipality,listing_type);
create index posts_feed on public.posts(moderation_status,post_type,created_at desc);
create index posts_listing on public.posts(listing_id);
create index posts_parent on public.posts(parent_id);
create index events_recipient on public.activity_events(recipient_id,created_at desc);
create index events_post on public.activity_events(post_id);
create index feedback_queue on public.posts(feedback_status) where post_type='feedback';

create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into profiles(id,display_name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Traveler'),80));
 insert into user_roles(user_id) values(new.id);
 return new;
end $$;
create trigger auth_profile after insert on auth.users for each row execute function public.new_profile();

-- Transaction locks make throttling concurrency safe. No frontend-only security gate.
create function public.guard_posts() returns trigger language plpgsql security definer set search_path=public as $$
declare parent posts; recent_count integer; media text; object_path text;
begin
 if auth.uid() is null then return new; end if; -- trusted seed/migration session only; RLS blocks anonymous inserts
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select count(*) into recent_count from activity_events where actor_id=auth.uid() and event_type='audit' and payload->>'action'='post_created' and created_at>now()-interval '1 minute';
  if recent_count>=5 then raise exception 'Too many submissions. Please wait one minute.'; end if;
  if new.author_id<>auth.uid() then raise exception 'Author mismatch'; end if;
  insert into activity_events(actor_id,event_type,payload) values(auth.uid(),'audit',jsonb_build_object('action','post_created','post_id',new.id));
  if not is_admin() then
   if new.post_type='announcement' then raise exception 'Administrator assurance required'; end if;
   new.moderation_status:='published';
   if new.post_type='feedback' then new.feedback_status:='Received';new.moderation_status:='pending'; end if;
  end if;
  new.created_at:=now();
 elsif not is_admin() then
  if pg_trigger_depth()>1 and new.moderation_status='pending' and (to_jsonb(new)-'moderation_status')=(to_jsonb(old)-'moderation_status') then return new;end if;
  if new.author_id<>old.author_id or new.post_type<>old.post_type or new.parent_id is distinct from old.parent_id or new.listing_id is distinct from old.listing_id or new.feedback_status is distinct from old.feedback_status or new.moderation_status<>old.moderation_status or new.created_at<>old.created_at then raise exception 'Protected post fields'; end if;
 end if;
 foreach media in array new.media_urls loop
  if new.post_type='feedback' then object_path:=media;
  else object_path:=split_part(media,'/storage/v1/object/public/post-media/',2); end if;
  if split_part(object_path,'/',1)<>new.author_id::text or not exists(select 1 from storage.objects where name=object_path and bucket_id=case when new.post_type='feedback' then 'feedback-evidence' else 'post-media' end) then raise exception 'Media must belong to the submitting user';end if;
 end loop;
 if new.parent_id is not null then
  select * into parent from posts where id=new.parent_id;
  if parent.id is null or parent.post_type not in ('social','review','comment','announcement') or parent.moderation_status<>'published' then raise exception 'Cannot reply to private or unavailable content'; end if;
 end if;
 return new;
end $$;
create trigger posts_guard before insert or update on public.posts for each row execute function public.guard_posts();
create function public.guard_listing() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or is_admin() then return new; end if;
 if TG_OP='INSERT' then
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
  if (select count(*) from listings where owner_id=auth.uid() and created_at>now()-interval '1 hour')>=5 then raise exception 'Listing rate limit';end if;
  if new.owner_id<>auth.uid() or new.listing_type not in ('enterprise','heritage') then raise exception 'Invalid listing request';end if;
  new.moderation_status:='pending';new.accreditation_status:='Unverified';new.fee_status:='unverified';new.created_at:=now();
  new.metadata:=('{"category":"Other tourism enterprises","activities":[],"image":"/landscape-1.svg","source_label":"UNVERIFIED","last_checked":null,"verified":false,"public_promotion":false,"community_benefit":0,"capacity":100,"baseline":0}'::jsonb||new.metadata-'verified'-'source_label'-'accreditation_evidence_url')||'{"verified":false,"source_label":"UNVERIFIED","public_promotion":false}'::jsonb;
 else
  if new.owner_id is distinct from old.owner_id or new.listing_type<>old.listing_type or new.accreditation_status<>old.accreditation_status or new.moderation_status<>old.moderation_status or new.fee_status<>old.fee_status or (new.metadata-array['services','amenities','address']) is distinct from (old.metadata-array['services','amenities','address']) or new.source_url is distinct from old.source_url or new.created_at<>old.created_at then raise exception 'Verification and publication require an administrator with MFA';end if;
  new.moderation_status:='pending';new.metadata:=new.metadata||'{"verified":false,"source_label":"UNVERIFIED","public_promotion":false}'::jsonb;
 end if;
 return new;
end $$;
create trigger listings_guard before insert or update on public.listings for each row execute function public.guard_listing();

create function public.post_events() returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid;
begin
 if TG_OP='INSERT' and new.post_type='announcement' then
  insert into activity_events(actor_id,recipient_id,post_id,event_type,payload) select new.author_id,p.id,new.id,'notification',jsonb_build_object('message','New public tourism announcement','url','/posts/'||new.id) from profiles p where p.id<>new.author_id;
 elsif TG_OP='INSERT' and new.parent_id is not null then
  select author_id into recipient from posts where id=new.parent_id;
  if recipient<>new.author_id then insert into activity_events(actor_id,recipient_id,post_id,event_type,payload) values(new.author_id,recipient,new.id,'notification',jsonb_build_object('message','New reply to your post','url','/posts/'||new.id));end if;
 elsif TG_OP='UPDATE' and (new.feedback_status is distinct from old.feedback_status or new.moderation_status<>old.moderation_status) then
  insert into activity_events(actor_id,recipient_id,post_id,event_type,payload) values(auth.uid(),new.author_id,new.id,case when new.post_type='feedback' then 'feedback_update' else 'moderation' end,jsonb_build_object('message',case when new.post_type='feedback' then 'Feedback status: '||new.feedback_status else 'Content decision: '||new.moderation_status end,'url',case when new.post_type='feedback' then '/feedback' else '/posts/'||new.id end));
  insert into activity_events(actor_id,post_id,event_type,payload) values(auth.uid(),new.id,'audit',jsonb_build_object('previous_status',old.moderation_status,'status',new.moderation_status,'feedback_status',new.feedback_status));
 end if;return new;
end $$;
create trigger posts_events after insert or update on public.posts for each row execute function public.post_events();
create function public.listing_events() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if to_jsonb(new) is distinct from to_jsonb(old) then
 insert into activity_events(actor_id,recipient_id,listing_id,event_type,payload) values(auth.uid(),new.owner_id,new.id,'business_review',jsonb_build_object('message','Listing review: '||new.moderation_status||' · '||new.accreditation_status,'url','/places/'||new.id));
 insert into activity_events(actor_id,listing_id,event_type,payload) values(auth.uid(),new.id,'audit',jsonb_build_object('previous_status',old.accreditation_status,'status',new.accreditation_status,'evidence',new.metadata->>'accreditation_evidence_url'));
 end if;return new;
end $$;
create trigger listing_events after update on public.listings for each row execute function public.listing_events();

-- All interaction events are server constructed. Clients cannot forge recipients/audit history.
create function public.interact(target uuid, kind text, reason text default '') returns void language plpgsql security definer set search_path=public as $$
declare p posts;
begin
 if not has_account_access() then raise exception 'Sign in and complete any enrolled MFA challenge';end if;
 select * into p from posts where id=target and post_type in ('social','review','comment','announcement') and moderation_status='published';
 if p.id is null then raise exception 'Post unavailable';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,2));
 if (select count(*) from activity_events where actor_id=auth.uid() and created_at>now()-interval '1 minute')>=20 then raise exception 'Interaction rate limit';end if;
 if kind='reaction' then
  if exists(select 1 from activity_events where actor_id=auth.uid() and post_id=target and event_type='reaction') then delete from activity_events where actor_id=auth.uid() and post_id=target and event_type='reaction';
  else insert into activity_events(actor_id,post_id,event_type) values(auth.uid(),target,'reaction');
   if p.author_id<>auth.uid() then insert into activity_events(actor_id,recipient_id,post_id,event_type,payload) values(auth.uid(),p.author_id,target,'notification',jsonb_build_object('message','Someone appreciated your post','url','/posts/'||target));end if;
  end if;
 elsif kind='report' then
  if length(trim(reason))<5 or length(reason)>1000 then raise exception 'Give a report reason (5–1000 characters)';end if;
  if (select count(*) from activity_events where actor_id=auth.uid() and event_type='report' and created_at>now()-interval '1 hour')>=10 then raise exception 'Report rate limit';end if;
  insert into activity_events(actor_id,post_id,event_type,payload) values(auth.uid(),target,'report',jsonb_build_object('reason',reason));
  -- The report trigger quarantines content; clients cannot invoke arbitrary moderation updates.
 else raise exception 'Unsupported event';end if;
end $$;
create function public.quarantine_report() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.event_type='report' then update posts set moderation_status='pending' where id=new.post_id;end if;return new;end $$;
create trigger quarantine_report after insert on public.activity_events for each row execute function public.quarantine_report();
create function public.mark_notifications_read(target uuid default null) returns void language sql security definer set search_path=public as $$
 update activity_events set read_at=now() where recipient_id=auth.uid() and has_account_access() and (target is null or id=target) and event_type in ('notification','feedback_update','moderation','business_review');
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.listings enable row level security;
alter table public.posts enable row level security;
alter table public.activity_events enable row level security;
alter table public.saved_items enable row level security;
alter table public.itineraries enable row level security;
alter table public.information_sources enable row level security;
create policy profiles_read on public.profiles for select using(true);
create policy profiles_update on public.profiles for update using(id=auth.uid() and has_account_access()) with check(id=auth.uid() and has_account_access());
create policy roles_self on public.user_roles for select using(user_id=auth.uid());
create policy listings_read on public.listings for select using(moderation_status='published' or (owner_id=auth.uid() and has_account_access()) or is_admin());
create policy listings_insert on public.listings for insert with check(owner_id=auth.uid() and has_account_access());
create policy listings_update on public.listings for update using((owner_id=auth.uid() and has_account_access()) or is_admin()) with check((owner_id=auth.uid() and has_account_access()) or is_admin());
create policy listings_delete on public.listings for delete using(is_admin());
create policy posts_read on public.posts for select using((post_type<>'feedback' and moderation_status='published') or (author_id=auth.uid() and has_account_access()) or is_admin());
create policy posts_insert on public.posts for insert with check(author_id=auth.uid() and has_account_access());
create policy posts_update on public.posts for update using((author_id=auth.uid() and has_account_access()) or is_admin()) with check((author_id=auth.uid() and has_account_access()) or is_admin());
create policy posts_delete on public.posts for delete using((author_id=auth.uid() and has_account_access()) or is_admin());
create policy events_read on public.activity_events for select using((recipient_id=auth.uid() and has_account_access()) or (actor_id=auth.uid() and has_account_access() and event_type='report') or is_admin() or (event_type='reaction' and exists(select 1 from posts where posts.id=post_id and posts.post_type<>'feedback' and posts.moderation_status='published')));
create policy saves_own on public.saved_items for all using(user_id=auth.uid() and has_account_access()) with check(user_id=auth.uid() and has_account_access());
create policy itineraries_own on public.itineraries for all using(user_id=auth.uid() and has_account_access()) with check(user_id=auth.uid() and has_account_access());
create policy sources_read on public.information_sources for select using(approved or is_admin());
create policy sources_admin on public.information_sources for all using(is_admin()) with check(is_admin());

-- Explicit minimum grants, independent of project default privileges.
revoke all on all tables in schema public from anon,authenticated;
grant select on profiles,listings,posts,activity_events,information_sources to anon,authenticated;
grant select on user_roles to authenticated;
grant update on profiles to authenticated;
grant insert,update,delete on listings,posts to authenticated;
grant select,insert,update,delete on saved_items,itineraries,information_sources to authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_admin(), public.has_account_access() to anon,authenticated;
grant execute on function public.interact(uuid,text,text), public.mark_notifications_read(uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('post-media','post-media',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp']),
 ('feedback-evidence','feedback-evidence',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy media_read on storage.objects for select using(bucket_id in ('post-media','avatars') or (bucket_id='feedback-evidence' and (((storage.foldername(name))[1]=auth.uid()::text and public.has_account_access()) or public.is_admin())));
create policy media_insert on storage.objects for insert to authenticated with check(bucket_id in ('post-media','avatars','feedback-evidence') and ((storage.foldername(name))[1]=auth.uid()::text and public.has_account_access()));
create policy media_delete on storage.objects for delete to authenticated using(bucket_id in ('post-media','avatars','feedback-evidence') and ((storage.foldername(name))[1]=auth.uid()::text and public.has_account_access()));
-- Enable recipient-only realtime; RLS is still enforced for every subscriber.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.activity_events;
 end if;
end $$;
