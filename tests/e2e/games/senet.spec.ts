import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Senet: throw, move by taps and a hint against the computer', async ({ page }) => {
  await freshStart(page, '/game/senet?deal=6');
  await page.getByTestId('sn-start').click();
  await expect(page.getByTestId('sn-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'senet');
  let moved = 0;
  for (let i = 0; i < 40 && moved < 3; i++) {
    if (await page.getByTestId('sn-throw').isVisible()) await page.getByTestId('sn-throw').click();
    const movable = page.locator('[data-movable]');
    if ((await movable.count()) > 0) {
      if (moved === 1) {
        await page.getByTestId('sn-hint').click();
        await expect(page.getByTestId('sn-message')).toContainText('Suggested');
      }
      await movable.first().click();
      moved++;
    }
    await page.waitForTimeout(700);
  }
  expect(moved).toBe(3);
});

test('Senet: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/senet?mode=watch&deal=3');
  await expect(page.getByTestId('sn-board').locator('[data-piece]').first()).toBeVisible({
    timeout: 8000,
  });
});
