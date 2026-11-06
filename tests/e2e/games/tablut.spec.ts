import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Tablut: move an attacker, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/tablut');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-square="3"]').click();
  await page.locator('[data-square="21"]').click();
  await expect(page.locator('[data-square="21"]')).toHaveAttribute('aria-label', 'd7, attacker');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'tablut');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-square="3"]').click();
  await page.locator('[data-square="21"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 12000 });
});
