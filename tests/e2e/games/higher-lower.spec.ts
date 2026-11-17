import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Higher or Lower: guess until the run ends', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/higher-lower?deal=2');
  await page.getByTestId('hl-mode-population').click();
  await page.getByTestId('hl-start').click();
  await expect(page.getByTestId('hl-b-name')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'higher-lower');
  // Always guessing Higher ends the run sooner or later.
  for (let i = 0; i < 40 && !(await page.getByTestId('hl-over').isVisible()); i++) {
    const higher = page.getByTestId('hl-higher');
    if (await higher.isVisible()) await higher.click();
    await page.waitForTimeout(400);
  }
  await expect(page.getByTestId('hl-over')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('hl-final')).toHaveText(/\d+/);
});
