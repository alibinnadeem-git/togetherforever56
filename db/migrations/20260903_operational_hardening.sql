-- Operational hardening: delivery outbox, retention execution, restore drills,
-- welfare disbursement, fundraising refunds, heritage tribute moderation.

create table if not exists app.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid null references app.emergency_announcements(id),
  person_id uuid not null references app.persons(id),
  channel text not null check (channel in ('in_app','email','sms','whatsapp','push')),
  destination_masked text null,
  status text not null default 'queued' check (status in ('queued','processing','sent','delivered','failed','cancelled')),
  provider_message_id text null,
  attempt_count integer not null default 0 check (attempt_count>=0),
  last_error text null,
  next_attempt_at timestamptz null,
  sent_at timestamptz null,
  delivered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(announcement_id,person_id,channel)
);
create index if not exists idx_notification_deliveries_status on app.notification_deliveries(status,next_attempt_at);

create table if not exists app.retention_jobs (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references app.retention_policies(id),
  entity_type text not null,
  status text not null default 'planned' check (status in ('planned','dry_run','approved','running','completed','completed_with_errors','failed','cancelled')),
  cutoff_at timestamptz null,
  candidate_count integer not null default 0,
  processed_count integer not null default 0,
  error_count integer not null default 0,
  result_summary jsonb not null default '{}'::jsonb,
  requested_by_person_id uuid null references app.persons(id),
  approved_by_person_id uuid null references app.persons(id),
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.backup_restore_drills (
  id uuid primary key default gen_random_uuid(),
  drill_type text not null check (drill_type in ('backup_verification','point_in_time_restore','media_restore','full_restore')),
  status text not null default 'planned' check (status in ('planned','running','passed','failed','cancelled')),
  source_snapshot text null,
  target_environment text null,
  started_at timestamptz null,
  completed_at timestamptz null,
  evidence_url text null,
  notes text null,
  requested_by_person_id uuid null references app.persons(id),
  verified_by_person_id uuid null references app.persons(id),
  created_at timestamptz not null default now()
);

create table if not exists app.welfare_disbursements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references app.welfare_cases(id),
  amount numeric(14,2) not null check (amount>0),
  currency varchar(8) not null default 'PKR',
  method text null,
  reference_text text null,
  evidence_url text null,
  status text not null default 'planned' check (status in ('planned','approved','sent','confirmed','reversed','cancelled')),
  approved_by_person_id uuid null references app.persons(id),
  confirmed_by_person_id uuid null references app.persons(id),
  created_by_person_id uuid not null references app.persons(id),
  sent_at timestamptz null,
  confirmed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists app.campaign_refunds (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references app.campaign_contributions(id),
  amount numeric(14,2) not null check (amount>0),
  currency varchar(8) not null,
  reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','sent','confirmed','declined','cancelled')),
  requested_by_person_id uuid null references app.persons(id),
  approved_by_person_id uuid null references app.persons(id),
  confirmed_by_person_id uuid null references app.persons(id),
  reference_text text null,
  evidence_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.heritage_tributes (
  id uuid primary key default gen_random_uuid(),
  heritage_record_id uuid not null references app.heritage_records(id),
  author_person_id uuid not null references app.persons(id),
  body text not null,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected','archived')),
  moderated_by_person_id uuid null references app.persons(id),
  moderated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_heritage_tributes_record_status on app.heritage_tributes(heritage_record_id,status,created_at desc);

insert into app.permissions(key,domain,action,description,is_sensitive) values
('notifications.deliver','notifications','deliver','Manage external notification delivery queue',true),
('retention.execute','retention','execute','Plan and approve retention execution jobs',true),
('backups.verify','backups','verify','Record and verify backup restore drills',true),
('welfare.disburse','welfare','disburse','Manage welfare disbursements',true),
('fundraising.refund','fundraising','refund','Manage campaign contribution refunds',true)
on conflict(key) do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key='administrator' and p.key in ('notifications.deliver','retention.execute','backups.verify','welfare.disburse','fundraising.refund')
on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key in ('president','governing_board') and p.key in ('retention.execute','backups.verify','welfare.disburse','fundraising.refund')
on conflict do nothing;
