import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Konane: open the board and jump, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/konane');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="14"]').click();
  await page.locator('[data-cell="15"]').click();
  await page.locator('[data-cell="12"]').click();
  await page.locator('[data-cell="14"]').click();
  await expect(page.getByTestId('counts')).toHaveText('Black 17 · White 16');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'konane');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[aria-label$="remove to open"]').first().click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
