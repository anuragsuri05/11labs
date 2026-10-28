import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, PAGES, trackErrors } from './helpers';

for (const width of [375, 1440]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 812 : 900 } });

    for (const p of PAGES) {
      test(`${p.title} loads without console errors or horizontal overflow`, async ({ page }) => {
        const errors = trackErrors(page);
        await page.goto(p.path);
        await expect(page.locator('header h1')).toHaveText(p.title);
        // Let the initial data requests (voices, models, history, health) settle.
        await page.waitForLoadState('networkidle');
        await expectNoHorizontalOverflow(page);
        expect(errors, errors.join('\n')).toEqual([]);
      });
    }
  });
}
