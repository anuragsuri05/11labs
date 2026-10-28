import { expect, test } from '@playwright/test';

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const wasDark = ((await html.getAttribute('class')) ?? '').includes('dark');

  await page.getByRole('button', { name: wasDark ? 'Switch to light mode' : 'Switch to dark mode' }).click();
  if (wasDark) await expect(html).not.toHaveClass(/\bdark\b/);
  else await expect(html).toHaveClass(/\bdark\b/);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await page.reload();
  if (wasDark) await expect(html).not.toHaveClass(/\bdark\b/);
  else await expect(html).toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(bg);

  // And back again.
  await page.getByRole('button', { name: wasDark ? 'Switch to dark mode' : 'Switch to light mode' }).click();
  if (wasDark) await expect(html).toHaveClass(/\bdark\b/);
  else await expect(html).not.toHaveClass(/\bdark\b/);
});
