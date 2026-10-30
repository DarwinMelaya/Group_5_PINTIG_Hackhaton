-- Compatibility migration for projects that applied the initial schema
-- without the registration/onboarding migration.
alter table public.profiles
  add column if not exists avatar_type text not null default 'default',
  add column if not exists avatar_id text,
  add column if not exists avatar_storage_path text;

alter table public.profiles drop constraint if exists profiles_avatar_type;
alter table public.profiles
  add constraint profiles_avatar_type
  check (avatar_type in ('default', 'avatar', 'upload'));
