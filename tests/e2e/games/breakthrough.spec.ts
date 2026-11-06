import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Breakthrough: advance and capture, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/breakthrough');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const p of [52, 44, 11, 19, 44, 36, 19, 27, 36, 27])
    await page.locator(`[data-cell="${p}"]`).click();
  await expect(page.getByTestId('counts')).toHaveText('White 16 · Black 15');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'breakthrough');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="52"]').click();
  await page.locator('[data-cell="44"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
