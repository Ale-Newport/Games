import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const sq = (r: number, c: number) => r * 8 + c;

test('English checkers: a capture against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/english-checkers');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const [a, b] of [
    [sq(5, 2), sq(4, 3)],
    [sq(2, 5), sq(3, 4)],
    [sq(4, 3), sq(2, 5)],
  ]) {
    await page.locator(`[data-square="${a}"]`).click();
    await page.locator(`[data-square="${b}"]`).click();
  }
  await expect(page.getByTestId('status-info')).toHaveText('Black 12 · White 11');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'checkers-capture');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator(`[data-square="${sq(5, 2)}"]`).click();
  await page.locator(`[data-square="${sq(4, 3)}"]`).click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
