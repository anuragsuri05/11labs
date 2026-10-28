import { expect, test } from '@playwright/test';
import { listModels } from './helpers';

test('voices can be filtered by model and searched', async ({ page, request }) => {
  const models = await listModels(request);
  await page.goto('/voices');
  await page.getByRole('tab', { name: /Explore/ }).click();

  const list = page.getByTestId('voice-list');
  const rows = list.locator(':scope > li');
  await expect(rows.first()).toBeVisible();
  const total = await page.getByTestId('voice-count').textContent();

  // Filter by a model that is not the first one, if the server has several.
  const target = models.find((m) => m.model_id === 'kokoro') ?? models[0];
  const chip = page.locator(`[data-model-filter="${target.model_id}"]`);
  if (models.length > 1) {
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('voice-count')).not.toHaveText(total ?? '');
  }
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  await expect(list.locator(`:scope > li:not([data-model-id="${target.model_id}"])`)).toHaveCount(0);
  await expect(rows.first().getByTestId('model-badge')).toHaveText(target.name);

  // Search for the first voice by name.
  const name = (await rows.first().locator('p').first().textContent())!.trim();
  await page.getByLabel('Search voices').fill(name);
  await expect(rows.first()).toContainText(name);
  for (const row of await rows.all()) await expect(row).toContainText(name, { ignoreCase: true });

  await page.getByLabel('Search voices').fill('zzzz-no-such-voice-zzzz');
  await expect(page.getByText('No voices match your search')).toBeVisible();

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(rows.first()).toBeVisible();
});
