import { db } from './db';

export type ScopedGrant = {
  role: string;
  permission: string;
  scopeType: string;
  scopeId: string | null;
};

export type AccessProfile = {
  personId: string;
  familyGroupId: string | null;
  fullName: string;
  membershipCode: string | null;
  relationshipPrefix: string | null;
  accountStatus: string;
  roles: string[];
  permissions: string[];
  scopedGrants: ScopedGrant[];
};

type PersonRow = {
  person_id: string;
  family_group_id: string | null;
  full_name: string;
  membership_code: string | null;
  relationship_prefix: string | null;
  account_status: string;
};

type GrantRow = {
  role_key: string;
  permission_key: string;
  scope_type: string;
  scope_id: string | null;
};

export async function accessForAuthUser(authUserId: string): Promise<AccessProfile | null> {
  const sql = db();
  const personResult = await sql`
    select
      p.id::text as person_id,
      p.family_group_id::text as family_group_id,
      p.full_name,
      mc.code as membership_code,
      rt.prefix as relationship_prefix,
      p.account_status
    from app.persons p
    left join app.membership_codes mc on mc.person_id = p.id
    left join app.relationship_types rt on rt.id = p.relationship_type_id
    where p.auth_user_id::text = ${authUserId}
    limit 1
  `;
  const person = (personResult as unknown as PersonRow[])[0];
  if (!person) return null;

  const grantResult = await sql`
    select
      r.key as role_key,
      perm.key as permission_key,
      coalesce(pr.scope_type,'global') as scope_type,
      pr.scope_id::text as scope_id
    from app.person_roles pr
    join app.roles r on r.id = pr.role_id and r.is_active = true
    join app.role_permissions rp on rp.role_id = r.id
    join app.permissions perm on perm.id = rp.permission_id
    where pr.person_id = ${person.person_id}::uuid
      and pr.starts_at <= now()
      and (pr.ends_at is null or pr.ends_at > now())
  `;
  const grants = grantResult as unknown as GrantRow[];
  const globalGrants = grants.filter(g => g.scope_type === 'global');

  return {
    personId: person.person_id,
    familyGroupId: person.family_group_id,
    fullName: person.full_name,
    membershipCode: person.membership_code,
    relationshipPrefix: person.relationship_prefix,
    accountStatus: person.account_status,
    roles: [...new Set(globalGrants.map(g => g.role_key))],
    permissions: [...new Set(globalGrants.map(g => g.permission_key))],
    scopedGrants: grants
      .filter(g => g.scope_type !== 'global')
      .map(g => ({ role: g.role_key, permission: g.permission_key, scopeType: g.scope_type, scopeId: g.scope_id })),
  };
}

export function hasPermission(access: AccessProfile | null, permission: string) {
  return Boolean(access?.accountStatus === 'active' && access.permissions.includes(permission));
}

export function hasScopedPermission(access: AccessProfile | null, permission: string, scopeType: string, scopeId: string | null) {
  if (!access || access.accountStatus !== 'active') return false;
  if (access.permissions.includes(permission)) return true;
  return access.scopedGrants.some(grant => grant.permission === permission && grant.scopeType === scopeType && grant.scopeId === scopeId);
}
