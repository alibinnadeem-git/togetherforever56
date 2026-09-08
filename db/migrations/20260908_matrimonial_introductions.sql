create table if not exists app.matrimonial_matches (
  id uuid primary key default gen_random_uuid(),
  request_a_id uuid not null references app.family_requests(id) on delete cascade,
  request_b_id uuid not null references app.family_requests(id) on delete cascade,
  initiated_by_person_id uuid not null references app.persons(id) on delete cascade,
  status text not null default 'proposed' check (status in ('proposed','awaiting_consent','mutual_consent','introduced','declined','withdrawn','completed','archived')),
  introduced_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matrimonial_match_distinct_requests check (request_a_id <> request_b_id),
  constraint matrimonial_match_unique_pair unique (request_a_id,request_b_id)
);

create table if not exists app.matrimonial_match_consents (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references app.matrimonial_matches(id) on delete cascade,
  person_id uuid not null references app.persons(id) on delete cascade,
  consent_status text not null default 'pending' check (consent_status in ('pending','approved','declined','withdrawn')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matrimonial_match_consent_unique unique(match_id,person_id)
);

create table if not exists app.matrimonial_match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references app.matrimonial_matches(id) on delete cascade,
  actor_person_id uuid references app.persons(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into app.permissions(key,domain,action,description,is_sensitive)
values ('matrimonial.review','matrimonial','review','Review matrimonial requests and introductions without exposing contact details before mutual consent',true)
on conflict(key) do nothing;

insert into app.role_permissions(role_id,permission_id,granted_by_person_id)
select r.id,p.id,null
from app.roles r
join app.permissions p on p.key='matrimonial.review'
where r.key='administrator'
on conflict do nothing;
