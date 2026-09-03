-- Together Forever membership identity helpers
-- Enforces five-digit family roots and derived relationship codes at the database boundary.

create or replace function app.format_membership_code(
  p_prefix text,
  p_root_number text,
  p_ordinal integer default null
) returns text
language plpgsql
immutable
as $$
begin
  if p_root_number !~ '^[0-9]{5}$' then
    raise exception 'Membership root number must contain exactly five digits.' using errcode='22023';
  end if;

  if p_prefix is null or btrim(p_prefix) = '' then
    raise exception 'Relationship prefix is required.' using errcode='22023';
  end if;

  if p_ordinal is null then
    return upper(btrim(p_prefix)) || '-' || p_root_number;
  end if;

  if p_ordinal < 1 then
    raise exception 'Relationship ordinal must be greater than zero.' using errcode='22023';
  end if;

  return upper(btrim(p_prefix)) || '-' || p_ordinal::text || '-' || p_root_number;
end $$;

create or replace function app.next_available_membership_root()
returns varchar(5)
language plpgsql
volatile
as $$
declare
  candidate varchar(5);
  attempts integer := 0;
begin
  loop
    attempts := attempts + 1;
    candidate := lpad((10000 + floor(random() * 90000))::integer::text, 5, '0');

    exit when not exists (
      select 1 from app.family_groups fg where fg.root_number = candidate
    );

    if attempts >= 500 then
      raise exception 'Unable to generate an available five-digit membership root.';
    end if;
  end loop;

  return candidate;
end $$;

create or replace function app.validate_membership_code_row()
returns trigger
language plpgsql
as $$
declare
  v_prefix text;
  v_requires_ordinal boolean;
  v_expected text;
begin
  select prefix, requires_ordinal
    into v_prefix, v_requires_ordinal
  from app.relationship_types
  where id = new.relationship_type_id
    and is_active = true;

  if v_prefix is null then
    raise exception 'Active relationship type is required.';
  end if;

  if new.root_number !~ '^[0-9]{5}$' then
    raise exception 'Membership root number must contain exactly five digits.';
  end if;

  if v_requires_ordinal and new.ordinal is null then
    raise exception 'An ordinal is required for relationship type %.', v_prefix;
  end if;

  if not v_requires_ordinal then
    new.ordinal := null;
  end if;

  v_expected := app.format_membership_code(v_prefix, new.root_number, new.ordinal);
  new.code := v_expected;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_membership_code_validate on app.membership_codes;
create trigger trg_membership_code_validate
before insert or update of relationship_type_id, root_number, ordinal, code
on app.membership_codes
for each row execute function app.validate_membership_code_row();

create unique index if not exists uq_membership_family_relationship_ordinal
on app.membership_codes(family_group_id, relationship_type_id, coalesce(ordinal,0));
