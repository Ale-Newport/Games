import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Water Sort: lift, drop, undo and sort with hints', async ({ page }) => {
  await freshStart(page, '/game/water-sort?deal=6');
  await page.getByTestId('so-start').click();
  await expect(page.getByTestId('so-tubes')).toBeVisible();
  await page.getByTestId('so-hint').click();
  await page.getByTestId('so-apply').click();
  await expect(page.getByTestId('so-moves')).toHaveText('Moves 1');
  await page.getByTestId('so-undo').click();
  await expect(page.getByTestId('so-moves')).toHaveText('Moves 0');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'water-sort');
  for (let i = 0; i < 80; i++) {
    if (await page.getByTestId('so-again').isVisible()) break;
    await page.getByTestId('so-hint').click();
    await page.getByTestId('so-apply').click();
  }
  await expect(page.getByTestId('so-message')).toContainText('Sorted in');
});

test('Water Sort: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/water-sort?mode=watch');
  await expect(page.getByTestId('so-moves')).not.toHaveText('Moves 0', { timeout: 8000 });
});
