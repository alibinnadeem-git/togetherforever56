import { createHash } from 'node:crypto';
import { createNeonAuth } from '@neondatabase/auth/next/server';

function required(name: 'NEON_AUTH_BASE_URL' | 'DATABASE_URL') {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function cookieSecret() {
  const explicit = process.env.NEON_AUTH_COOKIE_SECRET;
  if (explicit && explicit.length >= 32) return explicit;

  // Vercel's Neon integration injects DATABASE_URL and NEON_AUTH_BASE_URL.
  // Derive a stable server-only signing secret when an explicit cookie secret
  // has not yet been configured. Setting NEON_AUTH_COOKIE_SECRET later takes
  // precedence and will intentionally invalidate cached sessions once.
  return createHash('sha256')
    .update(`togetherforever56:neon-auth:${required('DATABASE_URL')}`)
    .digest('base64url');
}

export const auth = createNeonAuth({
  baseUrl: required('NEON_AUTH_BASE_URL'),
  cookies: {
    secret: cookieSecret(),
    sessionDataTtl: 300,
  },
});
