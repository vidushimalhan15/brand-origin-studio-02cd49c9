-- Content strategy settings per anonymous session
create table if not exists content_strategy (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  preset_id text not null default 'education-first',
  custom_mix jsonb,
  product_mention integer not null default 20,
  updated_at timestamptz not null default now()
);

alter table content_strategy enable row level security;
create policy "allow all" on content_strategy for all using (true) with check (true);

-- auto-update updated_at
create trigger set_updated_at_content_strategy
  before update on content_strategy
  for each row execute procedure moddatetime(updated_at);
