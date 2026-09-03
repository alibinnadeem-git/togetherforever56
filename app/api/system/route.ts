import { NextResponse } from 'next/server';
import { platformCounts } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const counts = await platformCounts();
    return NextResponse.json({
      ok: true,
      app: 'togetherforever56',
      foundation: counts,
      integrations: {
        database: Boolean(process.env.DATABASE_URL),
        neonAuth: Boolean(process.env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_URL),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown system error',
      },
      { status: 500 },
    );
  }
}
