import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test("Three Men's Morris: placements against a friend, then the CPU replies", async ({ page }) => {
  await freshStart(page, '/game/three-mens-morris');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="a3"]').click();
  await page.locator('[data-point="c1"]').click();
  await expect(page.locator('[data-point="a3"]')).toHaveAttribute('aria-label', /white piece/);
  await expect(page.locator('[data-point="c1"]')).toHaveAttribute('aria-label', /black piece/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'three-mens-morris');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="a3"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
