import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Backgammon: roll, move by taps and by a hint against the computer', async ({ page }) => {
  await freshStart(page, '/game/backgammon?deal=11');
  await page.getByTestId('bg-len-1').click();
  await page.getByTestId('bg-start').click();
  const board = page.getByTestId('rb-board');
  await expect(board).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'backgammon');
  let turns = 0;
  for (let i = 0; i < 30 && turns < 2; i++) {
    if (await page.getByTestId('bg-roll').isVisible()) await page.getByTestId('bg-roll').click();
    if (await page.getByTestId('bg-hint').isVisible()) {
      if (turns === 0) {
        await page.getByTestId('bg-hint').click();
        await expect(page.getByTestId('bg-message')).toContainText('Suggested');
        await page.getByTestId('bg-apply').click();
      } else {
        for (let k = 0; k < 4 && (await page.getByTestId('bg-hint').isVisible()); k++) {
          if ((await board.locator('[data-movable]').count()) === 0) break;
          await board.locator('[data-movable]').first().click();
          await board.locator('[data-target]').first().click();
        }
      }
      turns++;
    }
    await page.waitForTimeout(500);
  }
  expect(turns).toBe(2);
  await expect(page.getByText(/^Pips/)).not.toHaveText('Pips 167 · 167');
});

test('Backgammon: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/backgammon?mode=watch&deal=5');
  await expect(page.getByText(/^Pips/)).not.toHaveText('Pips 167 · 167', { timeout: 8000 });
});
