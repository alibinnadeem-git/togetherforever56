import { db } from './db';

export type AccessProfile = {
  personId: string;
  familyGroupId: string | null;
  fullName: string;
  membershipCode: string | null;
  relationshipPrefix: string | null;
  accountStatus: string;
  roles: string[];
  permissions: string[];
};

type AccessRow = {
  person_id: string;
  family_group_id: string | null;
  full_name: string;
  membership_code: string | null;
  relationship_prefix: string | null;
  account_status: string;
  roles: string[] | null;
  permissions: string[] | null;
};

export async function accessForAuthUser(authUserId: string): Promise<AccessProfile | null> {
  const sql = db();
  const result = await sql`
    select
      p.id::text as person_id,
      p.family_group_id::text as family_group_id,
      p.full_name,
      mc.code as membership_code,
      rt.prefix as relationship_prefix,
      p.account_status,
      coalesce(array_agg(distinct r.key) filter (where r.key is not null), '{}') as roles,
      coalesce(array_agg(distinct perm.key) filter (where perm.key is not null), '{}') as permissions
    from app.persons p
    left join app.membership_codes mc on mc.person_id = p.id
    left join app.relationship_types rt on rt.id = p.relationship_type_id
    left join app.person_roles pr on pr.person_id = p.id
      and pr.starts_at <= now()
      and (pr.ends_at is null or pr.ends_at > now())
    left join app.roles r on r.id = pr.role_id and r.is_active = true
    left join app.role_permissions rp on rp.role_id = r.id
    left join app.permissions perm on perm.id = rp.permission_id
    where p.auth_user_id::text = ${authUserId}
    group by p.id, p.family_group_id, p.full_name, mc.code, rt.prefix, p.account_status
    limit 1
  `;

  const rows = result as unknown as AccessRow[];
  const row = rows[0];
  if (!row) return null;

  return {
    personId: row.person_id,
    familyGroupId: row.family_group_id,
    fullName: row.full_name,
    membershipCode: row.membership_code,
    relationshipPrefix: row.relationship_prefix,
    accountStatus: row.account_status,
    roles: row.roles ?? [],
    permissions: row.permissions ?? [],
  };
}

export function hasPermission(access: AccessProfile | null, permission: string) {
  return Boolean(access?.accountStatus === 'active' && access.permissions.includes(permission));
}
