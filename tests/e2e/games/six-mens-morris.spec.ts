import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test("Six Men's Morris: placements against a friend, then the CPU replies", async ({ page }) => {
  await freshStart(page, '/game/six-mens-morris');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="b6"]').click();
  await page.locator('[data-point="f2"]').click();
  await expect(page.locator('[data-point="b6"]')).toHaveAttribute('aria-label', /white piece/);
  await expect(page.locator('[data-point="f2"]')).toHaveAttribute('aria-label', /black piece/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'six-mens-morris');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="b6"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
