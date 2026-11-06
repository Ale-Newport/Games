import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Pentago: place and twist against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/pentago');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="0"]').click();
  await page.getByTestId('twist-0R').click();
  await expect(page.locator('[data-cell="2"]')).toHaveAttribute('aria-label', 'c6, white marble');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'pentago');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="14"]').click();
  await page.getByTestId('twist-3L').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
