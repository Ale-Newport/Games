import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sudoku 6×6: place a digit and solve with hints', async ({ page }) => {
  await freshStart(page, '/game/sudoku-6x6?deal=7');
  await page.getByTestId('sudoku-difficulty-easy').click();
  await page.getByTestId('sudoku-start').click();
  await expect(page.getByTestId('sudoku-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'sudoku-6x6');
  for (let i = 0; i < 36; i++) {
    if (await page.getByTestId('sudoku-again').isVisible()) break;
    await page.getByTestId('sudoku-hint').click();
    await page.getByTestId('sudoku-fill').click();
  }
  await expect(page.getByTestId('sudoku-message')).toContainText('Solved in');
});

test('Sudoku 6×6: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/sudoku-6x6?mode=watch');
  await expect(page.getByTestId('sudoku-message')).toContainText('The AI', { timeout: 5000 });
});
