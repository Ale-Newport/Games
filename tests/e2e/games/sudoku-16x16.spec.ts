import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sudoku 16×16: place a digit and solve with hints', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/sudoku-16x16?deal=7');
  await page.getByTestId('sudoku-difficulty-easy').click();
  await page.getByTestId('sudoku-start').click();
  await expect(page.getByTestId('sudoku-board')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'sudoku-16x16');
  for (let i = 0; i < 256; i++) {
    if (await page.getByTestId('sudoku-again').isVisible()) break;
    await page.getByTestId('sudoku-hint').click();
    await page.getByTestId('sudoku-fill').click();
  }
  await expect(page.getByTestId('sudoku-message')).toContainText('Solved in');
});

test('Sudoku 16×16: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/sudoku-16x16?mode=watch');
  await expect(page.getByTestId('sudoku-message')).toContainText('The AI', { timeout: 15_000 });
});
