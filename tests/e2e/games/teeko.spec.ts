import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Teeko: a square against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/teeko');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const p of [0, 20, 1, 21, 5, 22, 6]) await page.locator(`[data-cell="${p}"]`).click();
  await expect(page.getByTestId('mnk-status')).toContainText('Four in a line or a square');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'teeko');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="12"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
