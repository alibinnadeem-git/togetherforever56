create table if not exists app.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.persons(id) on delete cascade,
  category text not null check (category in ('general','events','opportunities','welfare','critical')),
  channel text not null check (channel in ('in_app','email','sms','whatsapp','push')),
  enabled boolean not null default true,
  consent_status text not null default 'granted' check (consent_status in ('granted','withdrawn','not_required')),
  consented_at timestamptz,
  withdrawn_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(person_id,category,channel)
);

create table if not exists app.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_person_id uuid not null references app.persons(id),
  invitee_email text not null,
  relationship_key text,
  referral_code text not null unique,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null,
  accepted_auth_user_id uuid,
  note text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index if not exists ix_invitations_inviter on app.invitations(inviter_person_id,created_at desc);
create index if not exists ix_invitations_email on app.invitations(lower(invitee_email),status);

create table if not exists app.support_view_sessions (
  id uuid primary key default gen_random_uuid(),
  actor_person_id uuid not null references app.persons(id),
  target_person_id uuid not null references app.persons(id),
  reason text not null,
  status text not null default 'active' check (status in ('active','expired','revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (actor_person_id<>target_person_id)
);
create index if not exists ix_support_view_active on app.support_view_sessions(actor_person_id,status,expires_at desc);

insert into app.permissions(key,domain,action,description,is_sensitive) values
('invitations.manage','invitations','manage','Manage invitations and referral lifecycle',false),
('support.view','support','view','Open a time-limited read-only support view of another member',true)
on conflict (key) do nothing;
insert into app.role_permissions(role_id,permission_id)
select r.id,p.id from app.roles r cross join app.permissions p
where r.key='administrator' and p.key in ('invitations.manage','support.view')
on conflict do nothing;
