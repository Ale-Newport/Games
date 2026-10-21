import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hex 11×11: a swap against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/hex-11x11');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.locator('[data-cell]')).toHaveCount(121);
  await page.locator('[data-cell="60"]').click();
  await page.getByTestId('swap').click();
  await expect(page.locator('[data-cell="60"]')).toHaveAttribute('aria-label', /blue stone/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hex-11');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="0"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 12000 });
});
