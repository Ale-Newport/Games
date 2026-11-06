import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Quarto: a winning line against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/quarto');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-piece="1"]').click();
  for (const [c, p] of [
    [0, 3],
    [1, 5],
    [2, 7],
  ]) {
    await page.locator(`[data-cell="${c}"]`).click();
    await page.locator(`[data-piece="${p}"]`).click();
  }
  await page.locator('[data-cell="3"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Quarto!');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'quarto');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-piece="0"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
