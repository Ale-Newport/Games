import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const cell = (page: Page, i: number) => page.locator(`[data-cell="${i}"]`);

test.describe('Tic-Tac-Toe 4×4', () => {
  test('two players: a full round to a column win', async ({ page }) => {
    await freshStart(page, '/game/tic-tac-toe-4x4');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    await expect(page.locator('[data-cell]')).toHaveCount(16);
    for (const i of [1, 0, 5, 4, 9, 8, 13]) await cell(page, i).click();
    await expect(page.getByTestId('mnk-status')).toContainText('wins!');
    await expect(page.getByTestId('score-x')).toHaveText('1');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 't4-local-win');
  });

  test('vs Perfect: the solver answers every move and the human cannot win', async ({ page }) => {
    await freshStart(page, '/game/tic-tac-toe-4x4');
    await page.getByTestId('difficulty-perfect').click();
    await page.getByTestId('start-match').click();
    const status = page.getByTestId('mnk-status');
    for (let move = 0; move < 8; move++) {
      // Wait for the CPU: either it is our turn again or the round has ended.
      await expect(status).toContainText(/Your turn|wins|draw/, { timeout: 5000 });
      if (await page.getByTestId('next-round').isVisible()) break;
      await page.locator('[data-cell][aria-label$="empty"]').first().click();
    }
    await expect(page.getByTestId('next-round')).toBeVisible({ timeout: 5000 });
    await expect(status).not.toContainText('You win');
    await screenshot(page, 't4-vs-perfect');
  });

  test('board fits the viewport and the hint marks a cell', async ({ page }) => {
    await freshStart(page, '/game/tic-tac-toe-4x4');
    await page.getByTestId('start-match').click();
    const box = (await page.getByTestId('mnk-board').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await page.getByRole('button', { name: 'Hint' }).click();
    await expect(page.locator('[data-cell][class*="hint"]')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 't4-hint');
  });
});
