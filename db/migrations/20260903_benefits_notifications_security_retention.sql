-- Together Forever PRD operational tranche: benefits, critical announcements,
-- retention governance, security events, and step-up authorization records.

create table if not exists app.member_benefits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider_name text,
  category text not null default 'general',
  description text,
  terms text,
  external_url text,
  audience_policy_id uuid references app.audience_policies(id),
  foreverpoints_cost bigint check (foreverpoints_cost is null or foreverpoints_cost >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','paused','expired','archived')),
  created_by_person_id uuid references app.persons(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.benefit_claims (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references app.member_benefits(id),
  person_id uuid not null references app.persons(id),
  status text not null default 'claimed' check (status in ('claimed','approved','redeemed','declined','cancelled','expired')),
  redemption_code text,
  notes text,
  claimed_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique(benefit_id,person_id)
);

create table if not exists app.emergency_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  severity text not null default 'important' check (severity in ('important','urgent','critical')),
  audience_policy_id uuid references app.audience_policies(id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  requires_acknowledgement boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published','expired','cancelled','archived')),
  created_by_person_id uuid references app.persons(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.announcement_acknowledgements (
  announcement_id uuid not null references app.emergency_announcements(id),
  person_id uuid not null references app.persons(id),
  acknowledged_at timestamptz not null default now(),
  primary key (announcement_id,person_id)
);

create table if not exists app.retention_policies (
  id uuid primary key default gen_random_uuid(),
  object_type text not null unique,
  retention_days integer check (retention_days is null or retention_days >= 0),
  disposition text not null default 'archive' check (disposition in ('archive','anonymize','delete_when_allowed','retain_indefinitely')),
  legal_hold_supported boolean not null default true,
  notes text,
  version integer not null default 1,
  is_active boolean not null default true,
  updated_by_person_id uuid references app.persons(id),
  updated_at timestamptz not null default now()
);

create table if not exists app.security_events (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references app.persons(id),
  auth_user_id text,
  event_type text not null,
  risk_level text not null default 'info' check (risk_level in ('info','low','medium','high','critical')),
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app.step_up_authorizations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.persons(id),
  purpose text not null,
  method text not null default 'password_reauth',
  authorized_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_member_benefits_status_dates on app.member_benefits(status,starts_at,ends_at);
create index if not exists idx_emergency_announcements_status_dates on app.emergency_announcements(status,starts_at,ends_at);
create index if not exists idx_security_events_person_created on app.security_events(person_id,created_at desc);

insert into app.permissions(key,domain,action,description,is_sensitive) values
  ('benefits.read','benefits','read','View authorized member benefits',false),
  ('benefits.manage','benefits','manage','Create and administer member benefits',true),
  ('benefits.claim','benefits','claim','Claim eligible member benefits',false),
  ('announcements.read','announcements','read','View authorized critical announcements',false),
  ('announcements.manage','announcements','manage','Create and publish critical announcements',true),
  ('analytics.read','analytics','read','View aggregate operational analytics',true),
  ('retention.manage','retention','manage','Configure data retention rules',true),
  ('security.audit','security','audit','Review security events and step-up records',true),
  ('security.stepup','security','stepup','Perform sensitive action reauthentication',true)
on conflict (key) do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key='administrator' and p.key in ('benefits.read','benefits.manage','benefits.claim','announcements.read','announcements.manage','analytics.read','retention.manage','security.audit','security.stepup')
on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key in ('member','family_member') and p.key in ('benefits.read','benefits.claim','announcements.read','security.stepup')
on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key in ('president','governing_board') and p.key in ('benefits.read','benefits.manage','announcements.read','announcements.manage','analytics.read','security.audit','security.stepup')
on conflict do nothing;
