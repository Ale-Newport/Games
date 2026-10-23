import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Fox and Geese: a goose advances, then the CPU fox replies', async ({ page }) => {
  await freshStart(page, '/game/fox-and-geese');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="14"]').click();
  await page.locator('[data-point="21"]').click();
  await expect(page.locator('[data-point="21"]')).toHaveAttribute('aria-label', 'a4, goose');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'fox-and-geese');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-point="14"]').click();
  await page.locator('[data-point="21"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
