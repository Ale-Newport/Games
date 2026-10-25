import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string) => `[data-pile-card="${pile}:0"]`;

test('TriPeaks: tap plays, a draw, undo', async ({ page }) => {
  await freshStart(page, '/game/tripeaks?deal=1');
  await page.locator(card('p22')).click();
  await expect(page.locator(card('p22'))).toHaveCount(0);
  await expect(page.getByTestId('sol-info')).toHaveText('Run 1 · Stock 23');
  await page.locator('[data-pile-card="stock:22"]').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Run 0 · Stock 22');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'tripeaks');
  await page.getByTestId('sol-undo').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Run 1 · Stock 23');
});

test('TriPeaks: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/tripeaks?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
