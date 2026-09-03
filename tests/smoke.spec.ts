import { test, expect } from '@playwright/test';

test.describe('Together Forever production smoke', () => {
  test('public home renders approved identity', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Together Forever/i);
    await expect(page.getByText('Together Forever').first()).toBeVisible();
  });

  test('controlled access screens render', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.getByRole('heading', { name: /Enter the Network/i })).toBeVisible();
    await page.goto('/auth/sign-up');
    await expect(page.getByRole('heading', { name: /Create your secure account/i })).toBeVisible();
  });

  test('protected Network redirects unauthenticated users', async ({ page }) => {
    await page.goto('/network');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  for (const endpoint of [
    '/api/admin/members',
    '/api/admin/roles',
    '/api/network/events',
    '/api/network/inbox',
    '/api/network/directory',
    '/api/network/spaces',
    '/api/network/search?q=member',
    '/api/network/transactions',
    '/api/network/governance',
    '/api/foreverpoints/cases'
  ]) {
    test(`unauthenticated API denied: ${endpoint}`, async ({ request }) => {
      const response = await request.get(endpoint);
      expect([401, 403]).toContain(response.status());
    });
  }

  test('health endpoint succeeds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
