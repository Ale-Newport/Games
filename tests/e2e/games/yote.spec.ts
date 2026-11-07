import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Yoté: place, jump and take a bonus piece, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/yote');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="14"]').click();
  await page.locator('[data-cell="15"]').click();
  await page.locator('[data-cell="14"]').click();
  await page.locator('[data-cell="16"]').click();
  await page.getByTestId('from-hand').click();
  await expect(page.getByTestId('hand-1')).toHaveAttribute('aria-label', 'Dark pieces in hand: 10');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'yote');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-cell="14"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
