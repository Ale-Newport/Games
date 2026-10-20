import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const square = (name: string) => `[data-square="${name}"]`;

test('Three-Check: three checks against a friend win the game', async ({ page }) => {
  await freshStart(page, '/game/three-check-chess');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('status-info')).toHaveText('Checks — White 0/3 · Black 0/3');
  // 1. e4 d6 2. Bb5+ c6 3. Bxc6+ Nxc6 4. Qh5 a6 5. Qxf7+ — the third check.
  for (const [a, b] of [
    ['e2', 'e4'],
    ['d7', 'd6'],
    ['f1', 'b5'],
    ['c7', 'c6'],
    ['b5', 'c6'],
    ['b8', 'c6'],
    ['d1', 'h5'],
    ['a7', 'a6'],
    ['h5', 'f7'],
  ]) {
    await page.locator(square(a!)).click();
    await page.locator(square(b!)).click();
  }
  await expect(page.getByTestId('mnk-status')).toContainText('Player 1 wins');
  await expect(page.getByTestId('mnk-status')).toContainText('White gave the third check');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'three-check');
});
