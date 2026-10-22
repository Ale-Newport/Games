import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Cram: place dominoes either way, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/cram');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="14"]').click();
  await page.locator('[data-cell="15"]').click();
  await page.locator('[data-cell="3"]').click();
  await page.locator('[data-cell="9"]').click();
  await expect(page.locator('[data-cell="9"]')).toHaveAttribute('aria-label', 'd4, covered');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'cram');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-cell="0"]').click();
  await page.locator('[data-cell][aria-label$="completes the domino"]').first().click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|wins|win/, {
    timeout: 8000,
  });
});
