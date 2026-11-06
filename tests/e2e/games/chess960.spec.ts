import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Chess960: a shuffled start, a pawn move and the CPU reply', async ({ page }) => {
  await freshStart(page, '/game/chess960');
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('status-info')).toHaveText(/^Start position #\d{1,3}$/);
  await page.locator('[data-square="e2"]').click();
  await page.locator('[data-square="e4"]').click();
  await expect(page.locator('[data-square="e4"]')).toHaveAttribute('aria-label', 'e4, white pawn');
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await expect(page.getByTestId('move-list')).toContainText('1.e4');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'chess960');
  // Restart keeps the same start position.
  const before = await page.getByTestId('status-info').textContent();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByTestId('status-info')).toHaveText(before!);
});
