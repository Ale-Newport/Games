import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const cell = (page: Page, i: number) => page.locator(`[data-cell="${i}"]`);

test.describe('Misère Tic-Tac-Toe', () => {
  test('completing a line loses', async ({ page }) => {
    await freshStart(page, '/game/misere-tic-tac-toe');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    for (const i of [0, 3, 1, 4, 2]) await cell(page, i).click();
    await expect(page.getByTestId('mnk-status')).toContainText('Player 2 wins!');
    await expect(page.getByTestId('mnk-status')).toContainText('X completed three in a row.');
    await expect(page.getByTestId('score-o')).toHaveText('1');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'misere-loss');
  });

  test('vs Perfect: the solver opens in the center and never loses', async ({ page }) => {
    await freshStart(page, '/game/misere-tic-tac-toe');
    await page.getByTestId('difficulty-perfect').click();
    await page.getByTestId('play-as-o').click();
    await page.getByLabel('Alternate who starts each round').uncheck();
    await page.getByTestId('start-match').click();
    await expect(cell(page, 4)).toHaveAttribute('aria-label', /X$/, { timeout: 5000 });
    const status = page.getByTestId('mnk-status');
    for (let move = 0; move < 5; move++) {
      await expect(status).toContainText(/Your turn|wins|draw|Draw/, { timeout: 5000 });
      if (await page.getByTestId('next-round').isVisible()) break;
      await page.locator('[data-cell][aria-label$="empty"]').first().click();
    }
    await expect(page.getByTestId('next-round')).toBeVisible({ timeout: 5000 });
    await expect(status).not.toContainText('You win');
  });
});
