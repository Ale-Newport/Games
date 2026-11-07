import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Block Dominoes: follow hints and play tiles against the computer', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/block-dominoes?deal=6');
  await page.getByTestId('bd-level-easy').click();
  await page.getByTestId('bd-start').click();
  let played = 0;
  for (let i = 0; i < 60 && played < 2; i++) {
    if (await page.getByTestId('bd-hint').isVisible()) {
      await page.getByTestId('bd-hint').click();
      await expect(page.getByTestId('bd-message')).toContainText('Suggested');
      if (played === 0) {
        await expectNoHorizontalOverflow(page);
        await screenshot(page, 'block-dominoes');
      }
      if (await page.getByTestId('bd-draw').isVisible()) await page.getByTestId('bd-draw').click();
      else if (await page.getByTestId('bd-pass').isVisible())
        await page.getByTestId('bd-pass').click();
      else {
        // A hinted tile that fits several ends is already selected: pick an end.
        const end = page.locator('[data-testid^="bd-arm-"]').first();
        if (!(await end.isVisible())) await page.locator('[data-playable="true"]').first().click();
        if (await end.isVisible()) await end.click();
        played++;
      }
    }
    await page.waitForTimeout(300);
  }
  expect(played).toBeGreaterThan(0);
  await expect(page.getByTestId('bd-layout').locator('svg').first()).toBeVisible();
});

test('Block Dominoes: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/block-dominoes?mode=watch&deal=3');
  await expect(page.getByTestId('bd-layout').locator('svg').nth(1)).toBeVisible({ timeout: 8000 });
});
