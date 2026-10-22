import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Domineering: place dominoes with a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/domineering');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  const vertical =
    (await page.getByTestId('status-info').textContent()) === 'Blue places a vertical domino';
  await page.locator('[data-cell="27"]').click();
  await page.locator(`[data-cell="${vertical ? 35 : 28}"]`).click();
  await expect(page.locator('[data-cell="27"]')).toHaveAttribute('aria-label', 'd5, covered');
  await page.locator('[data-cell="10"]').click();
  await page.locator(`[data-cell="${vertical ? 11 : 18}"]`).click();
  await expect(page.locator('[data-cell="10"]')).toHaveAttribute('aria-label', 'c7, covered');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'domineering');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-cell="0"]').click();
  const partner = page.locator('[data-cell][aria-label$="completes the domino"]').first();
  await partner.click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
