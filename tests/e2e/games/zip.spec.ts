import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Number Trail: draw, cut back and finish with hints', async ({ page }) => {
  await freshStart(page, '/game/zip?deal=6');
  await page.getByTestId('zp-start').click();
  await expect(page.getByTestId('zp-covered')).toHaveText('1/25');
  for (let i = 0; i < 3; i++) {
    await page.getByTestId('zp-hint').click();
    await page.getByTestId('zp-fill').click();
  }
  await expect(page.getByTestId('zp-covered')).toHaveText('4/25');
  await page.getByTestId('zp-undo').click();
  await expect(page.getByTestId('zp-covered')).toHaveText('3/25');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'zip');
  for (let i = 0; i < 40; i++) {
    if (await page.getByTestId('zp-again').isVisible()) break;
    await page.getByTestId('zp-hint').click();
    await page.getByTestId('zp-fill').click();
  }
  await expect(page.getByTestId('zp-message')).toContainText('Solved in');
});

test('Number Trail: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/zip?mode=watch');
  await expect(page.getByTestId('zp-covered')).not.toHaveText(/^1\//, { timeout: 10_000 });
});
