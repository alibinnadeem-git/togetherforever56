alter table app.events
  add column if not exists capacity integer,
  add column if not exists registration_deadline timestamptz,
  add column if not exists check_in_enabled boolean not null default false,
  add column if not exists calendar_uid text;

alter table app.event_registrations
  add column if not exists guest_count integer not null default 0,
  add column if not exists waitlist_position integer,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by_person_id uuid references app.persons(id),
  add column if not exists updated_at timestamptz not null default now();

alter table app.member_benefits
  add column if not exists total_claim_limit integer,
  add column if not exists approval_required boolean not null default false,
  add column if not exists claim_valid_days integer not null default 30;

alter table app.benefit_claims
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by_person_id uuid references app.persons(id),
  add column if not exists expires_at timestamptz,
  add column if not exists redeemed_by_person_id uuid references app.persons(id),
  add column if not exists updated_at timestamptz not null default now();

insert into app.permissions(key,domain,action,description,is_sensitive)
values
 ('events.checkin','events','checkin','Check attendees into events',true),
 ('benefits.redeem','benefits','redeem','Approve and redeem benefit claims',true)
on conflict(key) do nothing;

insert into app.role_permissions(role_id,permission_id)
select r.id,p.id
from app.roles r
cross join app.permissions p
where r.key='administrator'
  and p.key in ('events.checkin','benefits.redeem')
on conflict do nothing;
