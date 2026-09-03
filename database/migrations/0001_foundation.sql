-- Together Forever foundation schema
-- Applied to Neon project pma56 / neondb on 2026-09-03.
-- Additive/idempotent migration: no destructive statements.

create schema if not exists app;

create table if not exists app.family_groups (
  id uuid primary key default gen_random_uuid(),
  root_number varchar(5) not null unique check (root_number ~ '^[0-9]{5}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.relationship_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  prefix text not null unique,
  requires_ordinal boolean not null default false,
  is_adult boolean not null default true,
  can_login boolean not null default true,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app.persons (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  family_group_id uuid references app.family_groups(id) on delete set null,
  relationship_type_id uuid references app.relationship_types(id) on delete restrict,
  full_name text not null,
  display_name text,
  email text,
  phone text,
  date_of_birth date,
  course_code text default '56 LC',
  service_number text,
  arm_or_service text,
  commission_date date,
  is_living boolean not null default true,
  account_status text not null default 'pending' check (account_status in ('pending','active','suspended','archived','deceased')),
  profile_visibility text not null default 'network' check (profile_visibility in ('private','m_only','network','public')),
  notes_public text,
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.membership_codes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references app.persons(id) on delete cascade,
  family_group_id uuid not null references app.family_groups(id) on delete cascade,
  relationship_type_id uuid not null references app.relationship_types(id) on delete restrict,
  root_number varchar(5) not null check (root_number ~ '^[0-9]{5}$'),
  ordinal integer check (ordinal is null or ordinal > 0),
  code text not null unique,
  self_change_count integer not null default 0 check (self_change_count >= 0),
  is_locked boolean not null default false,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.membership_code_history (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.persons(id) on delete cascade,
  old_code text not null,
  new_code text not null,
  changed_by_person_id uuid references app.persons(id) on delete set null,
  change_reason text,
  changed_at timestamptz not null default now()
);

create table if not exists app.family_relationships (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references app.family_groups(id) on delete cascade,
  from_person_id uuid not null references app.persons(id) on delete cascade,
  to_person_id uuid not null references app.persons(id) on delete cascade,
  relationship_type_id uuid not null references app.relationship_types(id) on delete restrict,
  verification_status text not null default 'pending' check (verification_status in ('pending','member_confirmed','admin_verified','rejected')),
  verified_by_person_id uuid references app.persons(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(from_person_id,to_person_id,relationship_type_id)
);

create table if not exists app.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by_person_id uuid references app.persons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  domain text not null,
  action text not null,
  description text,
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists app.role_permissions (
  role_id uuid not null references app.roles(id) on delete cascade,
  permission_id uuid not null references app.permissions(id) on delete cascade,
  granted_by_person_id uuid references app.persons(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key(role_id,permission_id)
);

create table if not exists app.person_roles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.persons(id) on delete cascade,
  role_id uuid not null references app.roles(id) on delete cascade,
  scope_type text not null default 'global' check (scope_type in ('global','space','chapter','committee','object')),
  scope_id uuid,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  assigned_by_person_id uuid references app.persons(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(person_id,role_id,scope_type,scope_id)
);

create table if not exists app.audience_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  policy_type text not null default 'custom' check (policy_type in ('public','network','m_only','family','relationship','space','role','selected','custom')),
  rules jsonb not null default '{}'::jsonb,
  created_by_person_id uuid references app.persons(id) on delete set null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.spaces (
  id uuid primary key default gen_random_uuid(),
  space_type text not null check (space_type in ('network','chapter','circle','committee','board','family','interest','custom')),
  name text not null,
  slug text not null unique,
  description text,
  audience_policy_id uuid references app.audience_policies(id) on delete set null,
  created_by_person_id uuid references app.persons(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.space_members (
  space_id uuid not null references app.spaces(id) on delete cascade,
  person_id uuid not null references app.persons(id) on delete cascade,
  membership_status text not null default 'active' check (membership_status in ('invited','pending','active','removed')),
  joined_at timestamptz not null default now(),
  primary key(space_id,person_id)
);

create table if not exists app.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  object_type text not null,
  description text,
  is_active boolean not null default true,
  created_by_person_id uuid references app.persons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references app.workflow_definitions(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  name text not null,
  required_permission_key text,
  required_role_key text,
  action_type text not null default 'approve' check (action_type in ('review','approve','reject','publish','ignite','certify','complete','custom')),
  config jsonb not null default '{}'::jsonb,
  unique(workflow_definition_id,step_order)
);

create table if not exists app.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references app.workflow_definitions(id) on delete restrict,
  object_type text not null,
  object_id uuid not null,
  current_step_order integer not null default 1,
  status text not null default 'submitted' check (status in ('draft','submitted','under_review','approved','rejected','published','ignited','completed','archived')),
  submitted_by_person_id uuid references app.persons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.approvals (
  id uuid primary key default gen_random_uuid(),
  workflow_instance_id uuid not null references app.workflow_instances(id) on delete cascade,
  workflow_step_id uuid not null references app.workflow_steps(id) on delete restrict,
  decided_by_person_id uuid references app.persons(id) on delete set null,
  decision text not null check (decision in ('approved','rejected','changes_requested')),
  notes text,
  decided_at timestamptz not null default now()
);

create table if not exists app.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null default 'gathering',
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  location_name text,
  location_address text,
  meeting_url text,
  audience_policy_id uuid references app.audience_policies(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','suggested','under_review','approved','ignited','cancelled','completed','archived')),
  suggested_by_person_id uuid references app.persons(id) on delete set null,
  owner_person_id uuid references app.persons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references app.events(id) on delete cascade,
  person_id uuid not null references app.persons(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','waitlisted','cancelled','attended','no_show')),
  registered_at timestamptz not null default now(),
  unique(event_id,person_id)
);

create table if not exists app.external_resources (
  id uuid primary key default gen_random_uuid(),
  owner_object_type text not null,
  owner_object_id uuid not null,
  provider text not null check (provider in ('google_drive','onedrive','sharepoint','external')),
  resource_type text not null check (resource_type in ('file','folder','album','video','document','url')),
  title text not null,
  url text not null,
  audience_policy_id uuid references app.audience_policies(id) on delete set null,
  added_by_person_id uuid references app.persons(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app.opportunities (
  id uuid primary key default gen_random_uuid(),
  opportunity_type text not null check (opportunity_type in ('job','internship','apprenticeship','business','volunteer','project','other')),
  title text not null,
  organization_name text,
  description text,
  location_text text,
  work_mode text,
  compensation_text text,
  application_url text,
  deadline timestamptz,
  audience_policy_id uuid references app.audience_policies(id) on delete set null,
  posted_by_person_id uuid references app.persons(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','pending','published','paused','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references app.opportunities(id) on delete cascade,
  applicant_person_id uuid not null references app.persons(id) on delete cascade,
  message text,
  external_reference text,
  status text not null default 'submitted' check (status in ('submitted','withdrawn','reviewing','shortlisted','interview','accepted','rejected','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(opportunity_id,applicant_person_id)
);

create table if not exists app.listings (
  id uuid primary key default gen_random_uuid(),
  listing_type text not null check (listing_type in ('general','service','land','property','vehicle','gold','digital_asset','software','education','other')),
  title text not null,
  description text,
  asking_price numeric(18,2),
  currency varchar(3) default 'PKR',
  location_text text,
  attributes jsonb not null default '{}'::jsonb,
  audience_policy_id uuid references app.audience_policies(id) on delete set null,
  seller_person_id uuid references app.persons(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','pending','published','reserved','sold','completed','rejected','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.listing_responses (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references app.listings(id) on delete cascade,
  responder_person_id uuid not null references app.persons(id) on delete cascade,
  message text,
  offered_amount numeric(18,2),
  currency varchar(3),
  status text not null default 'open' check (status in ('open','accepted','declined','withdrawn','closed')),
  created_at timestamptz not null default now()
);

create table if not exists app.campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_type text not null default 'fundraiser' check (campaign_type in ('fundraiser','welfare','scholarship','memorial','community','emergency','other')),
  title text not null,
  description text,
  goal_amount numeric(18,2),
  currency varchar(3) default 'PKR',
  starts_at timestamptz,
  ends_at timestamptz,
  audience_policy_id uuid references app.audience_policies(id) on delete set null,
  suggested_by_person_id uuid references app.persons(id) on delete set null,
  owner_person_id uuid references app.persons(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','suggested','under_review','approved','active','funded','completed','rejected','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.transactions (
  id uuid primary key default gen_random_uuid(),
  source_object_type text not null,
  source_object_id uuid,
  payer_person_id uuid references app.persons(id) on delete set null,
  receiver_person_id uuid references app.persons(id) on delete set null,
  amount numeric(18,2) not null check (amount >= 0),
  currency varchar(3) not null default 'PKR',
  payment_mode text not null check (payment_mode in ('platform','external')),
  payment_method text,
  external_reference text,
  evidence_url text,
  status text not null default 'pending' check (status in ('pending','arranged','sender_marked_paid','awaiting_receiver_confirmation','received','completed','disputed','cancelled','refunded')),
  sender_marked_paid_at timestamptz,
  receiver_confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.governance_positions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text,
  appointment_method text not null default 'selection' check (appointment_method in ('election','selection','appointment','hybrid')),
  eligibility_policy jsonb not null default '{}'::jsonb,
  electorate_policy jsonb not null default '{}'::jsonb,
  term_months integer check (term_months is null or term_months > 0),
  role_id uuid references app.roles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.office_terms (
  id uuid primary key default gen_random_uuid(),
  governance_position_id uuid not null references app.governance_positions(id) on delete restrict,
  holder_person_id uuid not null references app.persons(id) on delete restrict,
  method_used text not null check (method_used in ('election','selection','appointment','hybrid')),
  starts_on date not null,
  ends_on date,
  status text not null default 'active' check (status in ('scheduled','active','completed','removed')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists app.audit_logs (
  id bigserial primary key,
  actor_person_id uuid references app.persons(id) on delete set null,
  action text not null,
  object_type text not null,
  object_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  request_id text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_persons_family_group on app.persons(family_group_id);
create index if not exists idx_persons_auth_user on app.persons(auth_user_id);
create index if not exists idx_membership_codes_root on app.membership_codes(root_number);
create index if not exists idx_person_roles_person on app.person_roles(person_id);
create index if not exists idx_events_status_starts on app.events(status,starts_at);
create index if not exists idx_opportunities_type_status on app.opportunities(opportunity_type,status);
create index if not exists idx_listings_type_status on app.listings(listing_type,status);
create index if not exists idx_transactions_status on app.transactions(status);
create index if not exists idx_audit_object on app.audit_logs(object_type,object_id,created_at desc);

insert into app.relationship_types (key,label,prefix,requires_ordinal,is_adult,can_login,is_system) values
('member','Alumni Member','M',false,true,true,true),
('wife','Wife','W',false,true,true,true),
('son','Son','S',true,false,true,true),
('daughter','Daughter','D',true,false,true,true),
('grandson','Grandson','GS',true,false,true,true),
('granddaughter','Granddaughter','GD',true,false,true,true)
on conflict (key) do nothing;

insert into app.roles (key,name,description,is_system) values
('administrator','Administrator','Full platform administration',true),
('governing_board','Governing Board','Board governance role',true),
('president','President','President/authorized governing role',true),
('member','Member','Alumni member base role',true),
('family_member','Family Member','Family network base role',true)
on conflict (key) do nothing;

insert into app.permissions (key,domain,action,description,is_sensitive) values
('members.read','members','read','View permitted member records',false),
('members.create','members','create','Create member records',true),
('members.update','members','update','Update member records',true),
('members.archive','members','archive','Archive member records',true),
('roles.read','roles','read','View roles and permissions',false),
('roles.create','roles','create','Create roles',true),
('roles.update','roles','update','Change role definitions',true),
('roles.assign','roles','assign','Assign roles to people',true),
('events.create','events','create','Create or suggest events',false),
('events.approve','events','approve','Approve events',true),
('events.ignite','events','ignite','Publish/ignite approved events',true),
('marketplace.create','marketplace','create','Create marketplace listings',false),
('marketplace.moderate','marketplace','moderate','Moderate marketplace listings',true),
('fundraising.propose','fundraising','propose','Suggest fundraising causes',false),
('fundraising.approve','fundraising','approve','Approve fundraising campaigns',true),
('fundraising.manage','fundraising','manage','Manage fundraising campaigns',true),
('governance.configure','governance','configure','Configure positions and selection methods',true),
('governance.vote','governance','vote','Cast eligible governance vote',true),
('governance.certify','governance','certify','Certify governance outcomes',true),
('payments.confirm_receipt','payments','confirm_receipt','Confirm receipt for external payment',true)
on conflict (key) do nothing;

insert into app.audience_policies(name,description,policy_type,rules,is_system) values
('Public','Visible without authentication','public','{}'::jsonb,true),
('Together Forever Network','All active network accounts','network','{}'::jsonb,true),
('Alumni Members Only','Membership prefix M only','m_only','{"relationship_prefixes":["M"]}'::jsonb,true),
('Entire Family Network','All approved member and family identities','family','{}'::jsonb,true);
