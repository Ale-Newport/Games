import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Royal Game of Ur: throw, move by taps and a hint against the computer', async ({ page }) => {
  await freshStart(page, '/game/royal-game-of-ur?deal=6');
  await page.getByTestId('ur-start').click();
  await expect(page.getByTestId('ur-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'royal-game-of-ur');
  let moved = 0;
  for (let i = 0; i < 40 && moved < 3; i++) {
    if (await page.getByTestId('ur-throw').isVisible()) await page.getByTestId('ur-throw').click();
    const movable = page.locator('[data-movable]');
    if ((await movable.count()) > 0) {
      if (moved === 1) {
        await page.getByTestId('ur-hint').click();
        await expect(page.getByTestId('ur-message')).toContainText('Suggested');
      }
      await movable.first().click();
      moved++;
    }
    await page.waitForTimeout(700);
  }
  expect(moved).toBe(3);
});

test('Royal Game of Ur: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/royal-game-of-ur?mode=watch&deal=3');
  await expect(page.getByTestId('ur-board').locator('[data-piece]').first()).toBeVisible({
    timeout: 8000,
  });
});
