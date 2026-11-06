import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hex 7×7: a swap against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/hex-7x7');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.locator('[data-cell]')).toHaveCount(49);
  await page.locator('[data-cell="24"]').click();
  await page.getByTestId('swap').click();
  await expect(page.locator('[data-cell="24"]')).toHaveAttribute('aria-label', /blue stone/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hex-7');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="0"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 12000 });
});
