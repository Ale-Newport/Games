import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Isolation: step and remove a tile, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/isolation');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="38"]').click();
  await expect(page.getByTestId('status-info')).toHaveText('Step 2: remove any free tile');
  await page.locator('[data-cell="10"]').click();
  await expect(page.getByTestId('mobility')).toHaveText('Free steps — Gold 8 · Jade 4');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'isolation');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="38"]').click();
  await page.locator('[data-cell="17"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
  await expect(page.getByTestId('status-info')).toHaveText('Step 1: move your pawn one cell');
});
