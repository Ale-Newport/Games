import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hearts: pass three cards and play the first trick', async ({ page }) => {
  await freshStart(page, '/game/hearts?deal=3');
  await page.getByTestId('hearts-difficulty-easy').click();
  await page.getByTestId('hearts-start').click();
  await expect(page.getByTestId('hearts-status')).toHaveText(
    'Pick three cards to pass to the left',
  );
  const cards = page.getByTestId('trick-hand').locator('button');
  for (const k of [0, 1, 2]) await cards.nth(k).click();
  await expect(page.getByTestId('hearts-pass')).toContainText('3/3');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hearts');
  await page.getByTestId('hearts-pass').click();
  // Play legal cards until the player has played twice.
  for (let k = 0; k < 20 && (await cards.count()) > 11; k++) {
    const playable = page.getByTestId('trick-hand').locator('button:not([disabled])');
    if (await playable.count()) await playable.first().click();
    await page.waitForTimeout(1500);
  }
  expect(await cards.count()).toBeLessThan(13);
});

test('Hearts: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/hearts?mode=watch');
  await expect(page.getByTestId('trick-cards').locator('[role="img"]').first()).toBeVisible({
    timeout: 8000,
  });
});
