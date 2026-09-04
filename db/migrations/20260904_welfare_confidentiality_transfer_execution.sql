create table if not exists app.welfare_case_approvals(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references app.welfare_cases(id) on delete cascade,
  approval_stage text not null check(approval_stage in ('committee','board')),
  decision text not null check(decision in ('approved','partially_approved','rejected')),
  approved_amount numeric null check(approved_amount is null or approved_amount>=0),
  notes text,
  decided_by_person_id uuid not null references app.persons(id),
  decided_at timestamptz not null default now()
);
create index if not exists welfare_case_approvals_case_idx on app.welfare_case_approvals(case_id,decided_at desc);

create table if not exists app.welfare_case_access_grants(
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references app.welfare_cases(id) on delete cascade,
  person_id uuid not null references app.persons(id) on delete cascade,
  access_level text not null check(access_level in ('summary','full','finance')),
  granted_by_person_id uuid not null references app.persons(id),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  unique(case_id,person_id,access_level)
);

create table if not exists app.data_transfer_rows(
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references app.data_transfer_jobs(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null default '{}'::jsonb,
  mapped_data jsonb not null default '{}'::jsonb,
  validation_status text not null default 'pending' check(validation_status in ('pending','valid','error','skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id,row_number)
);

create table if not exists app.data_transfer_approvals(
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references app.data_transfer_jobs(id) on delete cascade,
  decision text not null check(decision in ('approved','rejected')),
  notes text,
  decided_by_person_id uuid not null references app.persons(id),
  decided_at timestamptz not null default now()
);

insert into app.permissions(key,domain,action,description,is_sensitive) values
 ('welfare.confidential.read','welfare','confidential.read','Access committee-level welfare details',true),
 ('welfare.board.read','welfare','board.read','Access board-level welfare details',true),
 ('imports.approve','imports','approve','Approve validated import jobs before execution',true)
on conflict(key) do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r join app.permissions p on p.key in ('welfare.confidential.read','welfare.board.read','imports.approve')
where r.key='administrator' on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r join app.permissions p on p.key in ('welfare.confidential.read','welfare.board.read')
where r.key in ('president','governing_board') on conflict do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r join app.permissions p on p.key='imports.approve'
where r.key in ('president','governing_board') on conflict do nothing;
