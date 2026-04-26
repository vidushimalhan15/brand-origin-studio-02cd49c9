-- Post ideation state table
create table if not exists post_ideation_state (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  peec_data jsonb,
  selected_peec_signals jsonb default '{"prompts":[],"chatGaps":[],"ugcBrief":[]}',
  ideas jsonb default '[]',
  saved_ideas jsonb default '[]',
  number_of_posts integer default 6,
  updated_at timestamptz not null default now()
);

alter table post_ideation_state enable row level security;
create policy "allow all post_ideation_state" on post_ideation_state for all using (true) with check (true);

create or replace function update_post_ideation_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_post_ideation
  before update on post_ideation_state
  for each row execute function update_post_ideation_updated_at();
