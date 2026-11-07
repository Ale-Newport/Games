import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Draw Dominoes: follow hints and play tiles against the computer', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/draw-dominoes?deal=6');
  await page.getByTestId('dd-level-easy').click();
  await page.getByTestId('dd-start').click();
  let played = 0;
  for (let i = 0; i < 60 && played < 2; i++) {
    if (await page.getByTestId('dd-hint').isVisible()) {
      await page.getByTestId('dd-hint').click();
      await expect(page.getByTestId('dd-message')).toContainText('Suggested');
      if (played === 0) {
        await expectNoHorizontalOverflow(page);
        await screenshot(page, 'draw-dominoes');
      }
      if (await page.getByTestId('dd-draw').isVisible()) await page.getByTestId('dd-draw').click();
      else if (await page.getByTestId('dd-pass').isVisible())
        await page.getByTestId('dd-pass').click();
      else {
        // A hinted tile that fits several ends is already selected: pick an end.
        const end = page.locator('[data-testid^="dd-arm-"]').first();
        if (!(await end.isVisible())) await page.locator('[data-playable="true"]').first().click();
        if (await end.isVisible()) await end.click();
        played++;
      }
    }
    await page.waitForTimeout(300);
  }
  expect(played).toBeGreaterThan(0);
  await expect(page.getByTestId('dd-layout').locator('svg').first()).toBeVisible();
});

test('Draw Dominoes: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/draw-dominoes?mode=watch&deal=3');
  await expect(page.getByTestId('dd-layout').locator('svg').nth(1)).toBeVisible({ timeout: 8000 });
});
