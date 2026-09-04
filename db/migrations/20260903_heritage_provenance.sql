-- Together Forever heritage, memorial and provenance foundation.
create table if not exists app.heritage_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null check (record_type in ('timeline','memorial','oral_history','document','photo','milestone','legacy_profile')),
  title text not null,
  summary text,
  body text,
  event_date date,
  person_id uuid references app.persons(id),
  audience_policy_id uuid references app.audience_policies(id),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','alumni_attestation','press_record','official_record')),
  status text not null default 'draft' check (status in ('draft','under_review','published','archived','disputed')),
  sort_order integer not null default 0,
  created_by_person_id uuid references app.persons(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists app.heritage_sources (
  id uuid primary key default gen_random_uuid(),
  heritage_record_id uuid not null references app.heritage_records(id) on delete cascade,
  source_type text not null,
  title text not null,
  reference_text text,
  source_url text,
  document_id uuid references app.documents(id),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','alumni_attestation','press_record','official_record')),
  notes text,
  verified_by_person_id uuid references app.persons(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists app.memorial_tributes (
  id uuid primary key default gen_random_uuid(),
  heritage_record_id uuid not null references app.heritage_records(id),
  author_person_id uuid not null references app.persons(id),
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  created_at timestamptz not null default now(),
  reviewed_by_person_id uuid references app.persons(id),
  reviewed_at timestamptz
);
create index if not exists idx_heritage_records_published_date on app.heritage_records(status,event_date,sort_order);
insert into app.permissions(key,domain,action,description,is_sensitive) values
 ('heritage.read','heritage','read','View authorized heritage and memorial records',false),
 ('heritage.create','heritage','create','Submit heritage and memorial records',false),
 ('heritage.manage','heritage','manage','Review, verify and publish heritage records',true)
on conflict(key) do nothing;
insert into app.role_permissions(role_id,permission_id) select r.id,p.id from app.roles r cross join app.permissions p where r.key='administrator' and p.key in ('heritage.read','heritage.create','heritage.manage') on conflict do nothing;
insert into app.role_permissions(role_id,permission_id) select r.id,p.id from app.roles r cross join app.permissions p where r.key in ('member','family_member') and p.key in ('heritage.read','heritage.create') on conflict do nothing;
insert into app.role_permissions(role_id,permission_id) select r.id,p.id from app.roles r cross join app.permissions p where r.key in ('president','governing_board') and p.key in ('heritage.read','heritage.create','heritage.manage') on conflict do nothing;
