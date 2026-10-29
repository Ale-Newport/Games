import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Towers of Hanoi: move three disks in the fewest moves', async ({ page }) => {
  await freshStart(page, '/game/towers-of-hanoi');
  await page.getByTestId('th-start').click();
  const peg = (i: number) => page.getByTestId('th-pegs').locator(`[data-peg="${i}"]`);
  await peg(0).click();
  await peg(2).click();
  await expect(page.getByTestId('th-moves')).toHaveText('Moves 1');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'towers-of-hanoi');
  for (const [a, b] of [
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 0],
    [1, 2],
    [0, 2],
  ]) {
    await peg(a!).click();
    await peg(b!).click();
  }
  await expect(page.getByTestId('th-message')).toContainText('fewest possible');
});

test('Towers of Hanoi: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/towers-of-hanoi?mode=watch');
  await expect(page.getByTestId('th-moves')).not.toHaveText('Moves 0', { timeout: 8000 });
});
