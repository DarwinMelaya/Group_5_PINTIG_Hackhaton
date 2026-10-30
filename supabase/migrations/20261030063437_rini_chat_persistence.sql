-- Persist RINI conversations and messages with per-account row access.
create table if not exists public.rini_conversations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rini_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.rini_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  sources jsonb not null default '[]'::jsonb,
  intent text,
  grounded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.rini_conversations enable row level security;
alter table public.rini_messages enable row level security;

drop policy if exists rini_conversations_own on public.rini_conversations;
create policy rini_conversations_own
  on public.rini_conversations for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists rini_messages_own on public.rini_messages;
create policy rini_messages_own
  on public.rini_messages for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.rini_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

revoke all on public.rini_conversations, public.rini_messages from anon;
grant select, insert, update, delete on public.rini_conversations, public.rini_messages to authenticated;

create index if not exists rini_messages_conversation_created
  on public.rini_messages (conversation_id, created_at);
