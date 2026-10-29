import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Twisty Cube 3×3: turn, undo and solve an easy scramble with hints', async ({ page }) => {
  await freshStart(page, '/game/twisty-cube-3x3?deal=4');
  await page.getByTestId('cu-level-easy').click();
  await page.getByTestId('cu-start').click();
  await page.getByTestId('cu-turn-R').click();
  await expect(page.getByTestId('cu-moves')).toHaveText('Turns 1');
  await page.getByTestId('cu-undo').click();
  await expect(page.getByTestId('cu-moves')).toHaveText('Turns 0');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'twisty-cube-3x3');
  for (let i = 0; i < 12; i++) {
    if (await page.getByTestId('cu-again').isVisible()) break;
    const turns = await page.getByTestId('cu-moves').textContent();
    await page.getByTestId('cu-hint').click();
    await page.getByTestId('cu-apply').click();
    await expect(page.getByTestId('cu-moves')).not.toHaveText(turns!);
  }
  await expect(page.getByTestId('cu-message')).toContainText('Solved in');
});

test('Twisty Cube 3×3: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/twisty-cube-3x3?mode=watch');
  await expect(page.getByTestId('cu-message')).toContainText('The AI', { timeout: 10_000 });
});
