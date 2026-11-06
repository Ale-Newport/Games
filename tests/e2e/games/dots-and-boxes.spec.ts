import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Dots and Boxes: close a box with a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/dots-and-boxes');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const l of [0, 20, 21, 4]) await page.locator(`[data-line="${l}"]`).click();
  await expect(page.getByTestId('scores')).toHaveText('Boxes — Orange 0 · Blue 1');
  await expect(page.getByTestId('status-info')).toHaveText('Box closed: Blue draws again');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'dots-and-boxes');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-line="17"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
