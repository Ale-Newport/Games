import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string, i: number) => `[data-pile-card="${pile}:${i}"]`;

test('Scorpion: build by suit, deal the reserve, undo', async ({ page }) => {
  await freshStart(page, '/game/scorpion?deal=1');
  await page.locator(card('c0', 6)).click();
  await page.locator(card('c0', 6)).click();
  await expect(page.locator(card('c6', 7))).toHaveAttribute('aria-label', 'five of clubs');
  await page.locator(card('stock', 2)).click();
  await expect(page.getByTestId('sol-info')).toHaveText('Stock 0');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'scorpion');
  await page.getByTestId('sol-undo').click();
  await expect(page.getByTestId('sol-info')).toHaveText('Stock 3');
});

test('Scorpion: the planner plays', async ({ page }) => {
  await freshStart(page, '/game/scorpion?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
