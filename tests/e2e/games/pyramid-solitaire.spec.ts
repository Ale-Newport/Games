import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string) => `[data-pile-card="${pile}:0"]`;

test('Pyramid: a king, a pair of 13, a draw', async ({ page }) => {
  await freshStart(page, '/game/pyramid-solitaire?deal=2');
  await page.locator(card('p21')).click();
  await page.locator(card('p21')).click();
  await expect(page.locator(card('p21'))).toHaveCount(0);
  await page.locator(card('p24')).click();
  await page.locator(card('p27')).click();
  await expect(page.getByTestId('sol-score')).toHaveText('15');
  await page.locator('[data-pile-card="stock:23"]').click();
  await expect(page.locator(card('waste'))).toHaveAttribute('aria-label', 'ace of hearts');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'pyramid-solitaire');
});

test('Pyramid: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/pyramid-solitaire?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
