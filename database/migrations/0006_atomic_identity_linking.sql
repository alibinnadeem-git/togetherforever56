-- Atomic identity + auth linking for Together Forever administration.

create or replace function app.create_linked_identity(
  p_auth_user_id uuid,
  p_full_name text,
  p_relationship_key text,
  p_root_number text default null,
  p_ordinal integer default null,
  p_actor_person_id uuid default null,
  p_account_status text default 'active'
) returns table(person_id uuid, membership_code text, root_number text)
language plpgsql
security definer
set search_path = app, neon_auth, public
as $$
declare
  v_relationship app.relationship_types%rowtype;
  v_family_id uuid;
  v_root varchar(5);
  v_ordinal integer;
  v_person_id uuid;
  v_code text;
  v_email text;
  v_base_role_key text;
begin
  if p_auth_user_id is null then raise exception 'Auth user is required.'; end if;
  if nullif(btrim(p_full_name),'') is null then raise exception 'Full name is required.'; end if;
  if p_account_status not in ('pending','active','suspended','archived','deceased') then
    raise exception 'Invalid account status.';
  end if;

  select email into v_email from neon_auth."user" where id = p_auth_user_id;
  if v_email is null then raise exception 'Neon Auth user not found.'; end if;
  if exists(select 1 from app.persons where auth_user_id = p_auth_user_id) then
    raise exception 'Auth user is already linked to a Together Forever identity.';
  end if;

  select * into v_relationship
  from app.relationship_types
  where key = lower(btrim(p_relationship_key)) and is_active = true;
  if v_relationship.id is null then raise exception 'Relationship type not found.'; end if;

  if v_relationship.key = 'member' then
    v_root := coalesce(nullif(btrim(p_root_number),''), app.next_available_membership_root());
    if v_root !~ '^[0-9]{5}$' then raise exception 'Membership root must contain exactly five digits.'; end if;
    insert into app.family_groups(root_number) values (v_root) returning id into v_family_id;
    v_ordinal := null;
    v_base_role_key := 'member';
  else
    v_root := nullif(btrim(p_root_number),'');
    if v_root is null or v_root !~ '^[0-9]{5}$' then
      raise exception 'An existing five-digit family root is required for family identities.';
    end if;
    select id into v_family_id from app.family_groups where family_groups.root_number = v_root;
    if v_family_id is null then raise exception 'Family root does not exist.'; end if;
    if v_relationship.requires_ordinal then
      v_ordinal := p_ordinal;
      if v_ordinal is null then
        select coalesce(max(mc.ordinal),0)+1 into v_ordinal
        from app.membership_codes mc
        where mc.family_group_id=v_family_id and mc.relationship_type_id=v_relationship.id;
      end if;
      if v_ordinal < 1 then raise exception 'Relationship ordinal must be greater than zero.'; end if;
    else
      v_ordinal := null;
    end if;
    v_base_role_key := 'family_member';
  end if;

  insert into app.persons(
    auth_user_id,family_group_id,relationship_type_id,full_name,email,account_status
  ) values (
    p_auth_user_id,v_family_id,v_relationship.id,btrim(p_full_name),v_email,p_account_status
  ) returning id into v_person_id;

  insert into app.membership_codes(
    person_id,family_group_id,relationship_type_id,root_number,ordinal,code
  ) values (
    v_person_id,v_family_id,v_relationship.id,v_root,v_ordinal,'pending'
  ) returning code into v_code;

  insert into app.person_roles(person_id,role_id,assigned_by_person_id)
  select v_person_id,r.id,p_actor_person_id from app.roles r where r.key=v_base_role_key and r.is_active=true
  on conflict do nothing;

  insert into app.audit_logs(actor_person_id,action,object_type,object_id,after_data)
  values (
    p_actor_person_id,'identity.link','person',v_person_id,
    jsonb_build_object('auth_user_id',p_auth_user_id,'membership_code',v_code,'relationship',v_relationship.key,'status',p_account_status)
  );

  return query select v_person_id,v_code,v_root::text;
end $$;
