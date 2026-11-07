import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Minesweeper: a safe start, a flag, and hints to the end', async ({ page }) => {
  await freshStart(page, '/game/minesweeper?deal=11');
  await page.getByTestId('mines-start').click();
  const board = page.getByTestId('mines-board');
  await board.locator('[data-cell="40"]').click();
  await expect(board.locator('[data-state="open"]').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'minesweeper');
  await board.locator('[data-state="closed"]').first().click({ button: 'right' });
  await expect(board.locator('[data-state="flag"]')).toHaveCount(1);
  await board.locator('[data-state="flag"]').first().click({ button: 'right' });
  for (let i = 0; i < 80; i++) {
    if (await page.getByTestId('mines-again').isVisible()) break;
    await page.getByTestId('mines-hint').click();
    if (await page.getByTestId('mines-apply').isVisible())
      await page.getByTestId('mines-apply').click();
  }
  await expect(page.getByTestId('mines-again')).toBeVisible();
});

test('Minesweeper: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/minesweeper?mode=watch');
  await expect(page.getByTestId('mines-board').locator('[data-state="open"]').first()).toBeVisible({
    timeout: 8000,
  });
});
