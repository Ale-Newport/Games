import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Nesting tic-tac-toe: a cover against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/stacking-gobblers');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.getByTestId('reserve-0-1').click();
  await page.locator('[data-cell="4"]').click();
  await page.getByTestId('reserve-1-3').click();
  await page.locator('[data-cell="4"]').click();
  await expect(page.locator('[data-cell="4"]')).toHaveAttribute(
    'aria-label',
    /Blue large cup, covering 1/,
  );
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'nesting');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.getByTestId('reserve-0-3').click();
  await page.locator('[data-cell="4"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
