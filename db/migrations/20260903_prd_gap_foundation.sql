-- Together Forever PRD gap foundation
-- Applied to Neon project pma56 / cool-field-32973212 on 2026-09-03.

insert into app.permissions(key,domain,action,description,is_sensitive) values
('media.create','media','create','Create gallery albums and media references',false),
('media.moderate','media','moderate','Moderate gallery albums and media references',false),
('business.create','business','create','Create member business profiles',false),
('business.moderate','business','moderate','Moderate and verify member businesses',true),
('community.post','community','post','Create community posts and Ask the Network requests',false),
('community.moderate','community','moderate','Moderate community content',true),
('governance.propose','governance','propose','Submit governance proposals',false),
('trust.report','trust','report','Report content or accounts for review',false),
('trust.block','trust','block','Block another user from direct interactions',false),
('trust.moderate','trust','moderate','Review reports and apply moderation actions',true),
('features.manage','platform','manage_features','Manage feature flags and rollout states',true),
('family.guardian.manage','family','guardian_manage','Manage guardian relationships and minor consents',true),
('documents.create','documents','create','Add document records or external document references',false),
('documents.moderate','documents','moderate','Moderate and manage controlled documents',true),
('exports.run','platform','export','Run controlled data exports',true),
('imports.run','platform','import','Run validated data imports',true)
on conflict(key) do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r join app.permissions p on p.key in
('media.create','business.create','community.post','governance.propose','trust.report','trust.block','documents.create')
where r.key in ('member','family_member') on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r join app.permissions p on p.key in
('media.create','media.moderate','business.create','business.moderate','community.post','community.moderate','governance.propose','trust.report','trust.block','trust.moderate','features.manage','family.guardian.manage','documents.create','documents.moderate','exports.run','imports.run')
where r.key='administrator' on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r join app.permissions p on p.key in
('media.moderate','business.moderate','community.moderate','trust.moderate','family.guardian.manage','documents.moderate')
where r.key in ('president','governing_board') on conflict do nothing;

create table if not exists app.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_person_id uuid not null references app.persons(id),
  target_type text not null,
  target_id uuid,
  target_person_id uuid references app.persons(id),
  reason_code text not null,
  details text,
  status text not null default 'open' check(status in ('open','under_review','actioned','dismissed','escalated','closed')),
  assigned_to_person_id uuid references app.persons(id),
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists moderation_reports_status_idx on app.moderation_reports(status,created_at desc);

create table if not exists app.user_blocks (
  blocker_person_id uuid not null references app.persons(id),
  blocked_person_id uuid not null references app.persons(id),
  reason text,
  created_at timestamptz not null default now(),
  primary key(blocker_person_id,blocked_person_id),
  check(blocker_person_id<>blocked_person_id)
);

create table if not exists app.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references app.moderation_reports(id),
  target_person_id uuid references app.persons(id),
  action_type text not null check(action_type in ('warning','posting_restriction','marketplace_restriction','messaging_restriction','temporary_suspension','permanent_ban','restore','none')),
  starts_at timestamptz,
  ends_at timestamptz,
  reason text not null,
  created_by_person_id uuid not null references app.persons(id),
  created_at timestamptz not null default now()
);

create table if not exists app.feature_flags (
  key text primary key,
  name text not null,
  description text,
  state text not null default 'off' check(state in ('off','beta','on')),
  audience_policy_id uuid references app.audience_policies(id),
  configuration jsonb not null default '{}'::jsonb,
  updated_by_person_id uuid references app.persons(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.configuration_versions (
  id uuid primary key default gen_random_uuid(),
  config_type text not null,
  config_key text not null,
  version_no integer not null check(version_no>0),
  snapshot jsonb not null,
  change_reason text,
  changed_by_person_id uuid references app.persons(id),
  created_at timestamptz not null default now(),
  unique(config_type,config_key,version_no)
);

create table if not exists app.guardianships (
  id uuid primary key default gen_random_uuid(),
  minor_person_id uuid not null references app.persons(id),
  guardian_person_id uuid not null references app.persons(id),
  relationship_label text,
  status text not null default 'pending' check(status in ('pending','active','revoked','expired')),
  verified_by_person_id uuid references app.persons(id),
  verified_at timestamptz,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(minor_person_id,guardian_person_id)
);

create table if not exists app.consent_records (
  id uuid primary key default gen_random_uuid(),
  subject_person_id uuid not null references app.persons(id),
  guardian_person_id uuid references app.persons(id),
  consent_type text not null,
  granted boolean not null,
  policy_version text not null,
  evidence jsonb not null default '{}'::jsonb,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

insert into app.feature_flags(key,name,description,state) values
('marketplace','Marketplace','Member marketplace and specialized listings','on'),
('matrimonial','Matrimonial Introductions','Adult-only controlled family introductions','beta'),
('gold_listings','Gold Listings','Moderated precious metals listings','beta'),
('native_payments','Native Payments','Platform-custodied or provider-native payments','off'),
('foreverpoints_transfers','ForeverPoints Transfers','Member-to-member ForeverPoints transfers','off'),
('ai_assistant','AI Assistant','Permission-aware Together Forever assistant','beta')
on conflict(key) do nothing;
