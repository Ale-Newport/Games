import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Ludo: roll and move against the computer', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/ludo?deal=8');
  await page.getByTestId('ld-count-2').click();
  await page.getByTestId('ld-start').click();
  await expect(page.getByTestId('cx-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'ludo');
  const roll = page.getByTestId('ld-roll');
  const token = page.locator('[data-movable]');
  let moved = 0;
  for (let i = 0; i < 120 && moved < 2; i++) {
    // Wait for the next decision: a throw to make or a token to move.
    await expect(roll.or(token.first())).toBeVisible({ timeout: 15_000 });
    if ((await token.count()) > 0) {
      if (moved === 1) {
        await page.getByTestId('ld-hint').click();
        await expect(page.getByTestId('ld-message')).toContainText('Suggested');
      }
      await token.first().click();
      moved++;
    } else await roll.click();
    await page.waitForTimeout(100);
  }
  expect(moved).toBe(2);
});

test('Ludo: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/ludo?mode=watch&deal=4');
  await expect(page.locator('[data-token]').first()).toBeVisible();
  await expect(page.getByTestId('ld-seat-0')).toBeVisible();
  await expect(page.getByTestId('ld-message')).not.toHaveText('', { timeout: 8000 });
});
