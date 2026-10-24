import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string, i: number) => `[data-pile-card="${pile}:${i}"]`;

test('Spider One Suit: a move, a deal, undo', async ({ page }) => {
  await freshStart(page, '/game/spider-1-suit?deal=1');
  await expect(page.getByTestId('sol-info')).toHaveText('Deals left 5');
  await page.locator(card('c2', 5)).click();
  await page.locator(card('c2', 5)).click();
  await expect(page.locator(card('c6', 5))).toHaveAttribute('aria-label', 'four of spades');
  await page.locator(card('stock', 49)).click();
  await expect(page.getByTestId('sol-info')).toHaveText('Deals left 4');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'spider-1-suit');
  await page.getByTestId('sol-undo').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Deals left 5');
});

test('Spider One Suit: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/spider-1-suit?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
