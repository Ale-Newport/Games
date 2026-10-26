import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Euchre: bid and play a card', async ({ page }) => {
  await freshStart(page, '/game/euchre?deal=1');
  await page.getByTestId('euchre-start').click();
  await expect(page.getByTestId('euchre-upcard')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'euchre');
  await page.getByTestId('euchre-pass').click();
  // Keep passing (or name the first suit when stuck) until trump is made.
  for (let k = 0; k < 10 && !(await page.getByTestId('euchre-trump').isVisible()); k++) {
    if (await page.getByTestId('euchre-pass').isVisible())
      await page.getByTestId('euchre-pass').click();
    else if (await page.getByTestId('euchre-bids').isVisible())
      await page.getByTestId('euchre-bids').locator('button').first().click();
    await page.waitForTimeout(900);
  }
  const playable = page.getByTestId('trick-hand').locator('button:not([disabled])');
  await expect(playable.first()).toBeVisible({ timeout: 8000 });
  const before = await page.getByTestId('trick-hand').locator('button').count();
  await playable.first().click();
  await expect(page.getByTestId('trick-hand').locator('button')).toHaveCount(before - 1);
});

test('Euchre: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/euchre?mode=watch');
  await expect(page.getByTestId('euchre-trump')).toBeVisible({ timeout: 10000 });
});
