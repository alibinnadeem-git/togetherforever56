-- ForeverPoints credits system
-- Immutable ledger is the source of truth; cached balances are derived summaries.

create table if not exists app.foreverpoints_accounts (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references app.persons(id) on delete cascade,
  status text not null default 'active' check (status in ('active','frozen','closed')),
  cached_balance bigint not null default 0 check (cached_balance >= 0),
  lifetime_earned bigint not null default 0 check (lifetime_earned >= 0),
  lifetime_spent bigint not null default 0 check (lifetime_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.foreverpoints_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null check (rule_type in ('earn','accept_spend')),
  name text not null,
  description text,
  activity_type text not null,
  source_object_type text,
  source_object_id uuid,
  points_amount bigint check (points_amount is null or points_amount > 0),
  points_per_unit numeric(18,6) check (points_per_unit is null or points_per_unit > 0),
  min_points bigint check (min_points is null or min_points >= 0),
  max_points bigint check (max_points is null or max_points >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  audience_policy_id uuid references app.audience_policies(id) on delete set null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by_person_id uuid references app.persons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.foreverpoints_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references app.foreverpoints_accounts(id) on delete restrict,
  person_id uuid not null references app.persons(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('earn','spend','admin_adjustment','expiry','reversal','transfer_in','transfer_out')),
  points_delta bigint not null check (points_delta <> 0),
  activity_type text,
  source_object_type text,
  source_object_id uuid,
  rule_id uuid references app.foreverpoints_rules(id) on delete set null,
  related_ledger_id uuid references app.foreverpoints_ledger(id) on delete set null,
  idempotency_key text unique,
  description text,
  expires_at timestamptz,
  created_by_person_id uuid references app.persons(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists app.foreverpoints_redemptions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.persons(id) on delete restrict,
  account_id uuid not null references app.foreverpoints_accounts(id) on delete restrict,
  activity_type text not null,
  source_object_type text,
  source_object_id uuid,
  points_requested bigint not null check (points_requested > 0),
  points_accepted bigint not null check (points_accepted >= 0),
  monetary_value numeric(18,2),
  currency varchar(3),
  status text not null default 'requested' check (status in ('requested','approved','completed','declined','cancelled','reversed')),
  ledger_id uuid references app.foreverpoints_ledger(id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_foreverpoints_ledger_person_created on app.foreverpoints_ledger(person_id,created_at desc);
create index if not exists idx_foreverpoints_ledger_expiry on app.foreverpoints_ledger(expires_at) where expires_at is not null;
create index if not exists idx_foreverpoints_rules_activity on app.foreverpoints_rules(activity_type,rule_type,is_active);

insert into app.permissions (key,domain,action,description,is_sensitive) values
('foreverpoints.read','foreverpoints','read','View permitted ForeverPoints balances and activity',false),
('foreverpoints.earn','foreverpoints','earn','Receive ForeverPoints from eligible activities',false),
('foreverpoints.spend','foreverpoints','spend','Redeem ForeverPoints where accepted',false),
('foreverpoints.rules.manage','foreverpoints','rules_manage','Create and manage ForeverPoints earning and acceptance rules',true),
('foreverpoints.adjust','foreverpoints','adjust','Perform audited administrative ForeverPoints adjustments',true),
('foreverpoints.audit','foreverpoints','audit','Review ForeverPoints ledger and reversals',true)
on conflict (key) do nothing;
