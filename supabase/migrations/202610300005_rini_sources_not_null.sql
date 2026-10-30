update public.rini_messages
set sources = '[]'::jsonb
where sources is null;

alter table public.rini_messages
  alter column sources set default '[]'::jsonb,
  alter column sources set not null;
