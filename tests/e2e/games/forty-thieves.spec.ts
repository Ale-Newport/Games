import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string, i: number) => `[data-pile-card="${pile}:${i}"]`;

test('Forty Thieves: a move in suit, a draw, undo', async ({ page }) => {
  await freshStart(page, '/game/forty-thieves?deal=2');
  await page.locator(card('c5', 3)).click();
  await page.locator(card('c5', 3)).click();
  await expect(page.locator(card('c0', 4))).toHaveAttribute('aria-label', 'two of hearts');
  await page.locator(card('stock', 63)).click();
  await expect(page.getByTestId('sol-info')).toHaveText('Stock 63');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'forty-thieves');
  await page.getByTestId('sol-undo').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Stock 64');
});

test('Forty Thieves: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/forty-thieves?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
