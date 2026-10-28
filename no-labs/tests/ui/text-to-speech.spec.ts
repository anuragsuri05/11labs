import { expect, test } from '@playwright/test';
import { listModels, trackErrors } from './helpers';

test('generates speech with a Kokoro voice and lists it in history', async ({ page, request }) => {
  test.setTimeout(4 * 60_000);
  const models = await listModels(request);
  test.skip(!models.some((m) => m.model_id === 'kokoro'), 'server has no kokoro model');

  const errors = trackErrors(page);
  await page.goto('/text-to-speech');

  // Pick Kokoro in the model dropdown; the voice picker switches to a Kokoro voice.
  await page.getByTestId('model-picker').click();
  await page.locator('[role="option"][data-model-id="kokoro"]').click();
  await expect(page.getByTestId('model-picker')).toHaveAttribute('aria-label', /Kokoro/);
  await expect(page.getByTestId('voice-picker')).not.toHaveAttribute('aria-label', /none selected/);
  // Kokoro voices carry their language, so there's no language select.
  await expect(page.locator('#tts-lang')).toHaveCount(0);

  // The voice list is scoped to Kokoro voices by default.
  await page.getByTestId('voice-picker').click();
  const rows = page.locator('[role="listbox"][aria-label="Voices"] [data-voice-id]');
  await expect(rows.first()).toBeVisible();
  await rows.first().locator('button').nth(1).click();
  await expect(page.getByTestId('model-picker')).toHaveAttribute('aria-label', /Kokoro/);

  const text = `NO LABS UI test ${Date.now()}. The quick brown fox jumps over the lazy dog.`;
  await page.getByLabel('Text to convert to speech').fill(text);

  // Generation streams: the page asks for a stream session, then plays /v1/streams/<token> right away.
  const session = page.waitForResponse(
    (r) => r.url().includes('/v1/text-to-speech/') && r.url().endsWith('/stream-session') && r.request().method() === 'POST',
    { timeout: 3 * 60_000 },
  );
  const stream = page.waitForRequest((r) => r.url().includes('/v1/streams/'), { timeout: 3 * 60_000 });
  await page.getByRole('button', { name: /Generate speech/ }).click();

  const res = await session;
  expect(res.status(), await res.text().catch(() => '')).toBe(200);
  expect(res.request().postDataJSON()).toMatchObject({ model_id: 'kokoro', text });
  const body = await res.json();
  expect(body.stream_url).toMatch(/^\/v1\/streams\//);
  expect(body.history_item_id).toBeTruthy();
  const streamReq = await stream;
  expect(new URL(streamReq.url()).pathname).toBe(body.stream_url);

  await expect(page.getByRole('region', { name: 'Audio player' })).toBeVisible();

  // Completion is detected by polling GET /v1/history/{id}; the item then shows up in the History tab
  // and the player switches out of the "Generating…" state.
  await expect(page.getByTestId('stream-progress')).toHaveCount(0, { timeout: 3 * 60_000 });
  await expect(page.getByRole('button', { name: 'Download audio' })).toBeEnabled();
  await page.getByRole('tab', { name: 'History' }).click();
  await expect(page.getByRole('tabpanel').getByText(text, { exact: false })).toBeVisible({ timeout: 30_000 });
  expect(errors, errors.join('\n')).toEqual([]);
});
