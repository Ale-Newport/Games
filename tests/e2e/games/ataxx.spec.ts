import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Ataxx: clone, jump and convert, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/ataxx');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const p of [0, 8, 6, 18, 8, 10]) await page.locator(`[data-cell="${p}"]`).click();
  await expect(page.getByTestId('counts')).toHaveText('Red 4 · Blue 1');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'ataxx');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="0"]').click();
  await page.locator('[data-cell="8"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
