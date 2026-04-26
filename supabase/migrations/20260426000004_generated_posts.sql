-- Generated posts table — persists AI-generated post content per session
create table if not exists generated_posts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  idea_id text not null,
  title text not null default '',
  platform text not null default '',
  content_type text not null default '',
  pillar text not null default '',
  peec_source text,
  peec_signal text,
  content text not null default '',
  slides jsonb default '[]',
  hashtags jsonb default '[]',
  approved boolean not null default false,
  content_format text default 'Text Post',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, idea_id)
);

alter table generated_posts enable row level security;
create policy "allow all generated_posts" on generated_posts for all using (true) with check (true);

create or replace function update_generated_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_generated_posts
  before update on generated_posts
  for each row execute function update_generated_posts_updated_at();

create index if not exists generated_posts_session_id_idx on generated_posts(session_id);
