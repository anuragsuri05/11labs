import path from 'path';
import { fileURLToPath } from 'url';
import { expect, test } from '@playwright/test';

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'tone.wav');

test('transcribes an uploaded wav and leaves the loading state', async ({ page }) => {
  test.setTimeout(4 * 60_000);
  await page.goto('/speech-to-text');

  // Model list comes from the server.
  const model = page.locator('#stt-model');
  await expect(model).toBeEnabled();
  expect(await model.locator('option').count()).toBeGreaterThan(0);

  await page.locator('input[type="file"]').setInputFiles(FIXTURE);
  const button = page.getByRole('button', { name: 'Transcribe' });
  await expect(button).toBeEnabled();

  const stt = page.waitForResponse((r) => r.url().endsWith('/v1/speech-to-text') && r.request().method() === 'POST', {
    timeout: 3 * 60_000,
  });
  await button.click();
  const res = await stt;
  expect(res.status(), await res.text().catch(() => '')).toBe(200);

  // A sine tone has no speech, so the transcript may be empty; the UI must still finish.
  await expect(page.locator('button[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Transcript' })).toBeVisible();
});
