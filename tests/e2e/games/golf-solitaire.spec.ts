import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string) => `[data-pile-card="${pile}:0"]`;

test('Golf: a tap play, a draw, undo', async ({ page }) => {
  await freshStart(page, '/game/golf-solitaire?deal=3');
  await page.locator(card('p19')).click();
  await expect(page.getByTestId('sol-score')).toHaveText('34');
  await page.locator('[data-pile-card="stock:15"]').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Stock 15');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'golf-solitaire');
  await page.getByTestId('sol-undo').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Stock 16');
});

test('Golf: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/golf-solitaire?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
