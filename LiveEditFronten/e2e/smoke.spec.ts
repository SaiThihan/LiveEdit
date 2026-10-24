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

    if (
      requestUrl.hostname === 'api.github.com' &&
      requestUrl.pathname === '/repos/clencyc/LiveEdit/contributors'
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(Array.from({ length: 13 }, (_, index) => ({
          login: `playwright-contributor-${index + 1}`,
          avatar_url: `https://avatars.githubusercontent.com/u/${index + 1}?v=4`,
          html_url: `https://github.com/playwright-contributor-${index + 1}`,
          contributions: (index + 1) * 10,
        }))),
      });
      return;
    }

    await route.abort();
  });

  await page.goto('/');
});

test('landing page loads and its main call to action opens sign-in', async ({ page }) => {
  await expect(page.getByText('AI Video Editor')).toBeVisible();
  await expect(page.getByRole('link', {
    name: 'playwright-contributor-13, 130 commits to LiveEdit',
  })).toBeVisible();

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

test('contributors are paginated six cards at a time', async ({ page }) => {
  const contributorGrid = page.getByTestId('contributors-grid');
  const pageLabel = page.getByText('Page 1 of 3');

  await expect(pageLabel).toBeVisible();
  await expect(contributorGrid.locator('> *')).toHaveCount(6);
  await expect(contributorGrid.getByText('C.Christine')).toBeVisible();
  await expect(contributorGrid.getByText('playwright-contributor-13')).toBeVisible();
  await expect(contributorGrid.getByText('playwright-contributor-9')).toBeVisible();
  await expect(contributorGrid.getByText('playwright-contributor-8')).toHaveCount(0);

  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Page 2 of 3')).toBeVisible();
  await expect(contributorGrid.locator('> *')).toHaveCount(6);
  await expect(contributorGrid.getByText('C.Christine')).toHaveCount(0);
  await expect(contributorGrid.getByText('playwright-contributor-8')).toBeVisible();
  await expect(contributorGrid.getByText('playwright-contributor-3')).toBeVisible();
  await expect(contributorGrid.getByText('playwright-contributor-9')).toHaveCount(0);

  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByText('Page 3 of 3')).toBeVisible();
  await expect(contributorGrid.locator('> *')).toHaveCount(2);
  await expect(contributorGrid.getByText('playwright-contributor-2')).toBeVisible();
  await expect(contributorGrid.getByText('playwright-contributor-1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByText('Page 2 of 3')).toBeVisible();
});
