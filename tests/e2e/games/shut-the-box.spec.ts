import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Shut the Box: a solo game by hints and taps', async ({ page }) => {
  await freshStart(page, '/game/shut-the-box?deal=3');
  await page.getByTestId('sb-start').click();
  await page.getByTestId('sb-roll').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'shut-the-box');
  for (let i = 0; i < 20; i++) {
    if (await page.getByTestId('sb-again').isVisible()) break;
    if (await page.getByTestId('sb-roll').isVisible()) await page.getByTestId('sb-roll').click();
    if (await page.getByTestId('sb-shut').isVisible()) {
      await page.getByTestId('sb-hint').click();
      await page.getByTestId('sb-shut').click();
    }
  }
  await expect(page.getByTestId('sb-again')).toBeVisible();
});

test('Shut the Box: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/shut-the-box?mode=watch&deal=3');
  await expect(page.getByTestId('sb-dice').locator('span').first()).toBeVisible({ timeout: 8000 });
});
