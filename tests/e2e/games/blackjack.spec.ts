import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Blackjack: bet, split aces, next round', async ({ page }) => {
  await freshStart(page, '/game/blackjack?deal=3');
  await page.getByRole('button', { name: 'Bet 25', exact: true }).click();
  await expect(page.getByTestId('bj-value-0')).toHaveText('2/12');
  await page.getByTestId('bj-split').click();
  await expect(page.getByTestId('bj-hand-1')).toBeVisible();
  await expect(page.getByTestId('bj-outcome-1')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'blackjack');
  await page.getByTestId('bj-next').click();
  await expect(page.getByRole('button', { name: 'Bet 10', exact: true })).toBeVisible();
});

test('Blackjack: basic strategy plays', async ({ page }) => {
  await freshStart(page, '/game/blackjack?mode=watch');
  await expect(page.getByTestId('bj-status')).toContainText('Basic strategy');
  await expect(page.getByTestId('bj-hand-0')).toBeVisible({ timeout: 6000 });
});
