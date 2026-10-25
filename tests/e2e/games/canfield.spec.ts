import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string, i: number) => `[data-pile-card="${pile}:${i}"]`;

test('Canfield: a card home, the reserve refills, draw three', async ({ page }) => {
  await freshStart(page, '/game/canfield?deal=3');
  await expect(page.getByTestId('sol-info')).toHaveText('Reserve 13 · Base 7');
  await page.locator(card('t1', 0)).click();
  await page.locator(card('t1', 0)).click();
  await expect(page.getByTestId('sol-info')).toHaveText('Reserve 12 · Base 7');
  await page.locator(card('stock', 33)).click();
  await expect(page.locator('[data-pile-card^="waste:"]')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'canfield');
});

test('Canfield: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/canfield?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
