create table if not exists app.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.persons(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent_hash text,
  status text not null default 'active' check(status in ('active','revoked','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_push_subscriptions_person_status on app.push_subscriptions(person_id,status);
