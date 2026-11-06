import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test("Nine Men's Morris: placements against a friend, then the CPU replies", async ({ page }) => {
  await freshStart(page, '/game/nine-mens-morris');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="a7"]').click();
  await page.locator('[data-point="g1"]').click();
  await expect(page.locator('[data-point="a7"]')).toHaveAttribute('aria-label', /white piece/);
  await expect(page.locator('[data-point="g1"]')).toHaveAttribute('aria-label', /black piece/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'nine-mens-morris');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="a7"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
