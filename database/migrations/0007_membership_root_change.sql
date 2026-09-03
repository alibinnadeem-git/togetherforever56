-- One-time self-service and administrator-controlled membership root changes.

create or replace function app.change_family_membership_root(
  p_member_person_id uuid,
  p_new_root text,
  p_actor_person_id uuid,
  p_admin_override boolean default false,
  p_reason text default null
) returns table(person_id uuid, old_code text, new_code text)
language plpgsql
security definer
set search_path=app,public
as $$
declare
  v_family_id uuid;
  v_member_code app.membership_codes%rowtype;
  v_old_root text;
  rec record;
begin
  if p_new_root !~ '^[0-9]{5}$' then raise exception 'New membership root must contain exactly five digits.'; end if;

  select mc.*,p.family_group_id into v_member_code
  from app.membership_codes mc
  join app.persons p on p.id=mc.person_id
  join app.relationship_types rt on rt.id=mc.relationship_type_id
  where mc.person_id=p_member_person_id and rt.key='member'
  for update;

  if v_member_code.id is null then raise exception 'Alumni member identity not found.'; end if;
  v_family_id := v_member_code.family_group_id;
  v_old_root := v_member_code.root_number;

  if not p_admin_override then
    if p_actor_person_id is distinct from p_member_person_id then raise exception 'Only the member may use self-service membership change.'; end if;
    if v_member_code.self_change_count >= 1 then raise exception 'The one-time self-service membership-number change has already been used.'; end if;
  end if;

  if exists(select 1 from app.family_groups where root_number=p_new_root and id<>v_family_id) then raise exception 'Membership root is already assigned.'; end if;
  if p_new_root=v_old_root then raise exception 'New membership root must be different.'; end if;

  create temporary table if not exists tmp_membership_before(person_id uuid,old_code text) on commit drop;
  truncate tmp_membership_before;
  insert into tmp_membership_before select mc.person_id,mc.code from app.membership_codes mc where mc.family_group_id=v_family_id;

  update app.family_groups set root_number=p_new_root,updated_at=now() where id=v_family_id;
  update app.membership_codes set root_number=p_new_root,
    self_change_count=case when person_id=p_member_person_id and not p_admin_override then self_change_count+1 else self_change_count end,
    updated_at=now()
  where family_group_id=v_family_id;

  for rec in
    select b.person_id,b.old_code,mc.code as new_code
    from tmp_membership_before b join app.membership_codes mc on mc.person_id=b.person_id
  loop
    insert into app.membership_code_history(person_id,old_code,new_code,changed_by_person_id,change_reason)
    values(rec.person_id,rec.old_code,rec.new_code,p_actor_person_id,coalesce(p_reason,case when p_admin_override then 'Administrator membership root change' else 'One-time member self-service change' end));
    person_id:=rec.person_id; old_code:=rec.old_code; new_code:=rec.new_code; return next;
  end loop;

  insert into app.audit_logs(actor_person_id,action,object_type,object_id,before_data,after_data,reason)
  values(p_actor_person_id,case when p_admin_override then 'membership.root.admin_change' else 'membership.root.self_change' end,'family_group',v_family_id,jsonb_build_object('root_number',v_old_root),jsonb_build_object('root_number',p_new_root),p_reason);
end $$;
