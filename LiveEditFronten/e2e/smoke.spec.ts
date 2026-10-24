import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('playwright-theme-initialized')) {
      localStorage.removeItem('app-theme');
      sessionStorage.setItem('playwright-theme-initialized', 'true');
    }
  });
  await page.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());

    if (requestUrl.pathname.startsWith('/api/')) {
      const body = requestUrl.pathname.endsWith('/api/audio-effects') ? [] : {};
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
      return;
    }

    if (requestUrl.origin === new URL(baseURL!).origin) {
      await route.continue();
      return;
    }

    if (
      requestUrl.hostname === 'api.github.com' &&
      requestUrl.pathname === '/repos/clencyc/LiveEdit'
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stargazers_count: 0 }),
      });
      return;
    }

    await route.abort();
  });

  await page.goto('/');
});

test('landing page loads and its main call to action opens sign-in', async ({ page }) => {
  await expect(page.getByText('AI Video Editor')).toBeVisible();

  const getStartedButton = page.getByRole('button', { name: 'Get Started' });
  await expect(getStartedButton).toBeVisible();
  await getStartedButton.click();

  await expect(page.getByRole('heading', { name: 'Sign in or create an account' })).toBeVisible();
});

test('theme toggle changes theme and persists the choice after reload', async ({ page }) => {
  const themeToggle = page.getByRole('switch');
  await expect(themeToggle).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await themeToggle.click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('app-theme'))).toBe('light');

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('app-theme'))).toBe('light');
  await expect(page.getByRole('switch')).toHaveCount(1);
});
