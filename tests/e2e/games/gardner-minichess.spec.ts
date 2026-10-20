import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const square = (name: string) => `[data-square="${name}"]`;

test('Gardner minichess: a 5×5 game against the CPU', async ({ page }) => {
  await freshStart(page, '/game/gardner-minichess');
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.locator('[data-square]')).toHaveCount(25);
  await page.locator(square('b1')).click();
  await page.locator(square('c3')).click();
  await expect(page.locator(square('c3'))).toHaveAttribute('aria-label', 'c3, white knight');
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await expect(page.getByTestId('move-list')).toContainText('1.Nc3');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'gardner');
});
