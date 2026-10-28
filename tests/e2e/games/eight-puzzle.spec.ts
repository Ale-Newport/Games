import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('8-Puzzle: slide, undo and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/eight-puzzle?deal=4');
  await page.getByTestId('sl-start').click();
  await expect(page.getByTestId('sl-board')).toBeVisible();
  for (const key of ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'])
    await page.keyboard.press(key);
  await expect(page.getByTestId('sl-moves')).not.toHaveText('Moves 0');
  await page.getByTestId('sl-face-picture').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'eight-puzzle');
  for (let i = 0; i < 50; i++) {
    if (await page.getByTestId('sl-again').isVisible()) break;
    await page.getByTestId('sl-hint').click();
    await page.getByTestId('sl-apply').click();
  }
  await expect(page.getByTestId('sl-message')).toContainText('Solved in');
});

test('8-Puzzle: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/eight-puzzle?mode=watch');
  await expect(page.getByTestId('sl-message')).toContainText('The AI', { timeout: 10_000 });
});
