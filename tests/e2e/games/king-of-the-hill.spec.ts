import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const square = (name: string) => `[data-square="${name}"]`;

test('King of the Hill: a king march to the center wins', async ({ page }) => {
  await freshStart(page, '/game/king-of-the-hill');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('status-info')).toHaveText('Hill: d4 · e4 · d5 · e5');
  // 1. e4 d5 2. exd5 e6 3. Ke2 Bb4 4. Kd3 Ba3 5. Ke4 — the white king reaches the hill.
  for (const [a, b] of [
    ['e2', 'e4'],
    ['d7', 'd5'],
    ['e4', 'd5'],
    ['e7', 'e6'],
    ['e1', 'e2'],
    ['f8', 'b4'],
    ['e2', 'd3'],
    ['b4', 'a3'],
    ['d3', 'e4'],
  ]) {
    await page.locator(square(a!)).click();
    await page.locator(square(b!)).click();
  }
  await expect(page.getByTestId('mnk-status')).toContainText('Player 1 wins');
  await expect(page.getByTestId('mnk-status')).toContainText("White's king reached the center");
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'king-of-the-hill');
});
