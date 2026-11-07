import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Narde: roll, move by taps and by a hint against the computer', async ({ page }) => {
  await freshStart(page, '/game/narde?deal=11');
  await page.getByTestId('nd-len-1').click();
  await page.getByTestId('nd-start').click();
  const board = page.getByTestId('rb-board');
  await expect(board).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'narde');
  let turns = 0;
  for (let i = 0; i < 30 && turns < 2; i++) {
    if (await page.getByTestId('nd-roll').isVisible()) await page.getByTestId('nd-roll').click();
    if (await page.getByTestId('nd-hint').isVisible()) {
      if (turns === 0) {
        await page.getByTestId('nd-hint').click();
        await expect(page.getByTestId('nd-message')).toContainText('Suggested');
        await page.getByTestId('nd-apply').click();
      } else {
        for (let k = 0; k < 4 && (await page.getByTestId('nd-hint').isVisible()); k++) {
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
  await expect(page.getByTestId('nd-pips')).not.toHaveText('Pips 360 · 360');
});

test('Narde: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/narde?mode=watch&deal=5');
  await expect(page.getByTestId('nd-pips')).not.toHaveText('Pips 360 · 360', { timeout: 8000 });
});
