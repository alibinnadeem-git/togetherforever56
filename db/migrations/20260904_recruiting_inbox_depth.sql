create table if not exists app.opportunity_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references app.opportunity_applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  actor_person_id uuid references app.persons(id),
  created_at timestamptz not null default now()
);

create table if not exists app.opportunity_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references app.opportunity_applications(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text,
  meeting_url text,
  location_text text,
  status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled','no_show')),
  interviewer_person_id uuid references app.persons(id),
  notes text,
  created_by_person_id uuid references app.persons(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references app.messages(id) on delete cascade,
  storage_provider text not null default 'external',
  url text not null,
  file_name text,
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

insert into app.permissions(key,domain,action,description,is_sensitive) values
('opportunities.review','opportunities','review','Review and stage opportunity applications',true),
('inbox.moderate','inbox','moderate','Moderate messaging when required by policy',true)
on conflict(key) do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key='administrator' and p.key in ('opportunities.review','inbox.moderate')
on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key in ('president','governing_board') and p.key='opportunities.review'
on conflict do nothing;
