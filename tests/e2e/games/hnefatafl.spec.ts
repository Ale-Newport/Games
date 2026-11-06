import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hnefatafl: move an attacker, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/hnefatafl');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-square="3"]').click();
  await page.locator('[data-square="25"]').click();
  await expect(page.locator('[data-square="25"]')).toHaveAttribute('aria-label', 'd9, attacker');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hnefatafl');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-square="3"]').click();
  await page.locator('[data-square="25"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 12000 });
});
