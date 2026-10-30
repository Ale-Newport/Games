import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Parchís: roll and move against the computer', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/parchis?deal=8');
  await page.getByTestId('pq-count-2').click();
  await page.getByTestId('pq-start').click();
  await expect(page.getByTestId('cx-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'parchis');
  const roll = page.getByTestId('pq-roll');
  const token = page.locator('[data-movable]');
  let moved = 0;
  for (let i = 0; i < 120 && moved < 2; i++) {
    // Wait for the next decision: a throw to make or a token to move.
    await expect(roll.or(token.first())).toBeVisible({ timeout: 15_000 });
    if ((await token.count()) > 0) {
      if (moved === 1) {
        await page.getByTestId('pq-hint').click();
        await expect(page.getByTestId('pq-message')).toContainText('Suggested');
      }
      await token.first().click();
      moved++;
    } else await roll.click();
    await page.waitForTimeout(100);
  }
  expect(moved).toBe(2);
});

test('Parchís: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/parchis?mode=watch&deal=4');
  await expect(page.locator('[data-token]').first()).toBeVisible();
  await expect(page.getByTestId('pq-seat-0')).toBeVisible();
  await expect(page.getByTestId('pq-message')).not.toHaveText('', { timeout: 8000 });
});
