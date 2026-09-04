import { test, expect } from '@playwright/test';

test.describe('Together Forever production smoke', () => {
  test('public home renders approved identity', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Together Forever/i);
    await expect(page.getByText('Together Forever').first()).toBeVisible();
  });

  test('public heritage route renders without leaking private network data', async ({ page }) => {
    await page.goto('/heritage');
    await expect(page.getByRole('heading', { name: /Heritage|Legacy|Memorial/i }).first()).toBeVisible();
  });

  test('controlled access screens render', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.getByRole('heading', { name: /Enter the Network/i })).toBeVisible();
    await page.goto('/auth/sign-up');
    await expect(page.getByRole('heading', { name: /Create your secure account/i })).toBeVisible();
    await page.goto('/auth/reset-password');
    await expect(page.getByText(/secure password setup|choose your password|Loading secure password setup/i).first()).toBeVisible();
  });

  for (const route of ['/network','/network/security','/network/media/upload','/admin']) {
    test(`protected page redirects unauthenticated users: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth\/sign-in/);
    });
  }

  for (const endpoint of [
    '/api/admin/members',
    '/api/admin/roles',
    '/api/admin/finance',
    '/api/network/events',
    '/api/network/inbox',
    '/api/network/directory',
    '/api/network/spaces',
    '/api/network/search?q=member',
    '/api/network/transactions',
    '/api/network/governance',
    '/api/network/media/file?id=00000000-0000-0000-0000-000000000000',
    '/api/foreverpoints/cases'
  ]) {
    test(`unauthenticated API denied: ${endpoint}`, async ({ request }) => {
      const response = await request.get(endpoint);
      expect([401, 403]).toContain(response.status());
    });
  }

  test('step-up endpoint denies anonymous callers', async ({ request }) => {
    const response = await request.post('/api/security/step-up', { data: { purpose: 'rbac.manage', password: 'x' } });
    expect(response.status()).toBe(401);
  });

  test('health endpoint succeeds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
