import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({ ok: true, app: 'togetherforever56', database: 'not-configured' });
  }

  try {
    const sql = neon(databaseUrl);
    const result = await sql`select current_database() as database, now() as checked_at`;
    return NextResponse.json({ ok: true, app: 'togetherforever56', database: 'connected', details: result[0] });
  } catch {
    return NextResponse.json({ ok: false, app: 'togetherforever56', database: 'error' }, { status: 503 });
  }
}
