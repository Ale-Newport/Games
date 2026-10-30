import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Pachisi: roll and move against the computer', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/pachisi?deal=8');
  await page.getByTestId('pc-count-2').click();
  await page.getByTestId('pc-start').click();
  await expect(page.getByTestId('cx-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'pachisi');
  const roll = page.getByTestId('pc-roll');
  const token = page.locator('[data-movable]');
  let moved = 0;
  for (let i = 0; i < 120 && moved < 2; i++) {
    // Wait for the next decision: a throw to make or a token to move.
    await expect(roll.or(token.first())).toBeVisible({ timeout: 15_000 });
    if ((await token.count()) > 0) {
      if (moved === 1) {
        await page.getByTestId('pc-hint').click();
        await expect(page.getByTestId('pc-message')).toContainText('Suggested');
      }
      await token.first().click();
      moved++;
    } else await roll.click();
    await page.waitForTimeout(100);
  }
  expect(moved).toBe(2);
});

test('Pachisi: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/pachisi?mode=watch&deal=4');
  await expect(page.locator('[data-token]').first()).toBeVisible();
  await expect(page.getByTestId('pc-seat-0')).toBeVisible();
  await expect(page.getByTestId('pc-message')).not.toHaveText('', { timeout: 8000 });
});
