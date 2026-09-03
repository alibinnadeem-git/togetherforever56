import { neon } from '@neondatabase/serverless';

let cached: ReturnType<typeof neon> | null = null;

export type PlatformCounts = {
  persons: number;
  families: number;
  roles: number;
  permissions: number;
  audience_policies: number;
  events: number;
  opportunities: number;
  listings: number;
  campaigns: number;
  open_transactions: number;
};

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!cached) cached = neon(process.env.DATABASE_URL);
  return cached;
}

export async function platformCounts(): Promise<PlatformCounts> {
  const sql = db();
  const result = await sql`
    select
      (select count(*)::int from app.persons) as persons,
      (select count(*)::int from app.family_groups) as families,
      (select count(*)::int from app.roles where is_active = true) as roles,
      (select count(*)::int from app.permissions) as permissions,
      (select count(*)::int from app.audience_policies where is_active = true) as audience_policies,
      (select count(*)::int from app.events where status not in ('archived','cancelled')) as events,
      (select count(*)::int from app.opportunities where status in ('pending','published')) as opportunities,
      (select count(*)::int from app.listings where status in ('pending','published','reserved')) as listings,
      (select count(*)::int from app.campaigns where status in ('suggested','under_review','approved','active')) as campaigns,
      (select count(*)::int from app.transactions where status not in ('completed','cancelled','refunded')) as open_transactions
  `;
  const rows = result as unknown as PlatformCounts[];
  if (!rows[0]) throw new Error('Platform count query returned no rows');
  return rows[0];
}
