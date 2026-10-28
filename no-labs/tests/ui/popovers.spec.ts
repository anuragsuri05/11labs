import { expect, test } from '@playwright/test';

// Popovers inside the settings panel must not spill out of it (the panel clips overflow).
for (const width of [375, 1440]) {
  test(`model and voice menus stay inside the settings panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/text-to-speech');

    for (const name of [/^Model/, /^Voice/]) {
      const trigger = page.getByRole('button', { name }).first();
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const menu = page.locator('[role="listbox"]').first();
      await expect(menu).toBeVisible();
      const box = await menu.boundingBox();
      const panel = await trigger.evaluate((el) => {
        let node: HTMLElement | null = el.parentElement;
        while (node && getComputedStyle(node).overflowX === 'visible' && getComputedStyle(node).overflowY === 'visible') {
          node = node.parentElement;
        }
        const r = (node ?? document.documentElement).getBoundingClientRect();
        return { left: r.left, right: r.right };
      });
      expect(box, 'menu has a box').not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(Math.max(0, panel.left) - 1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(Math.min(width, panel.right) + 1);
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
    }
  });
}
