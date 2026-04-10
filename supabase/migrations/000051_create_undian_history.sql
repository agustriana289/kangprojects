create table if not exists undian_history (
  id uuid default gen_random_uuid() primary key,
  source text not null,
  winner_count int not null,
  total_participants int not null,
  winners jsonb not null,
  drawn_at timestamptz default now()
);

alter table undian_history enable row level security;

create policy "Admin full access undian_history"
  on undian_history
  for all
  using (true)
  with check (true);
