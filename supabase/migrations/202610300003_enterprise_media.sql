-- Authorized enterprise photography: public reads are limited by the
-- application to approved rows, while upload/approval remains privileged.
create table if not exists public.enterprise_media (
  id uuid primary key default gen_random_uuid(),
  enterprise_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  image_url text,
  media_type text not null check(media_type in ('cover','product','service','facility')),
  alt_text text not null check(char_length(alt_text) between 5 and 300),
  source_url text,
  license_info text,
  permission_status text not null check(permission_status in ('pending','authorized','rejected')) default 'pending',
  approval_status text not null check(approval_status in ('pending','approved','rejected')) default 'pending',
  attribution text,
  display_order integer not null default 0 check(display_order >= 0),
  is_cover boolean not null default false,
  uploaded_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists enterprise_media_public_idx
  on public.enterprise_media(enterprise_id, approval_status, display_order);

alter table public.enterprise_media enable row level security;
drop policy if exists enterprise_media_read on public.enterprise_media;
create policy enterprise_media_read on public.enterprise_media for select
  using (approval_status = 'approved' and permission_status = 'authorized');
drop policy if exists enterprise_media_insert on public.enterprise_media;
create policy enterprise_media_insert on public.enterprise_media for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and has_account_access()
    and (
      is_admin()
      or exists(select 1 from public.listings l where l.id = enterprise_id and l.owner_id = auth.uid())
    )
  );
drop policy if exists enterprise_media_update on public.enterprise_media;
create policy enterprise_media_update on public.enterprise_media for update to authenticated
  using (is_admin() or uploaded_by = auth.uid())
  with check (is_admin() or uploaded_by = auth.uid());
drop policy if exists enterprise_media_delete on public.enterprise_media;
create policy enterprise_media_delete on public.enterprise_media for delete to authenticated
  using (is_admin() or uploaded_by = auth.uid());

revoke all on public.enterprise_media from anon, authenticated;
grant select on public.enterprise_media to anon, authenticated;
grant insert, update, delete on public.enterprise_media to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('enterprise-media', 'enterprise-media', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists enterprise_media_storage_read on storage.objects;
create policy enterprise_media_storage_read on storage.objects for select
  using (bucket_id = 'enterprise-media');
drop policy if exists enterprise_media_storage_insert on storage.objects;
create policy enterprise_media_storage_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'enterprise-media'
    and (storage.foldername(name))[1] in (
      select l.id::text from public.listings l where l.owner_id = auth.uid()
    )
    or (bucket_id = 'enterprise-media' and public.is_admin())
  );
drop policy if exists enterprise_media_storage_update on storage.objects;
create policy enterprise_media_storage_update on storage.objects for update to authenticated
  using (bucket_id = 'enterprise-media' and public.is_admin())
  with check (bucket_id = 'enterprise-media' and public.is_admin());
drop policy if exists enterprise_media_storage_delete on storage.objects;
create policy enterprise_media_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'enterprise-media' and public.is_admin());

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.enterprise_media;
  end if;
exception when duplicate_object then null;
end $$;
