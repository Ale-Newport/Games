import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Spades: bid and play the first trick', async ({ page }) => {
  await freshStart(page, '/game/spades?deal=1');
  await page.getByTestId('spades-difficulty-easy').click();
  await page.getByTestId('spades-start').click();
  await expect(page.getByTestId('spades-bids')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'spades');
  await page.getByTestId('spades-bid-3').click();
  const playable = page.getByTestId('trick-hand').locator('button:not([disabled])');
  await expect(playable.first()).toBeVisible({ timeout: 8000 });
  await playable.first().click();
  await expect(page.getByTestId('trick-hand').locator('button')).toHaveCount(12);
});

test('Spades: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/spades?mode=watch');
  await expect(page.getByTestId('trick-cards').locator('[role="img"]').first()).toBeVisible({
    timeout: 10000,
  });
});
