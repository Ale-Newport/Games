import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Amazons: move an amazon and shoot, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/amazons');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="93"]').click();
  await page.locator('[data-cell="83"]').click();
  await expect(page.getByTestId('amazons-phase')).toContainText('shoots');
  await page.locator('[data-cell="73"]').click();
  await expect(page.locator('[data-cell="73"]')).toHaveAttribute('aria-label', 'd3, burned');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'amazons');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
