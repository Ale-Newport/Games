import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const cell = (page: Page, i: number) => page.locator(`[data-cell="${i}"]`);

test.describe('Tic-Tac-Toe', () => {
  test('two players: a full round to a win, then the next round', async ({ page }) => {
    await freshStart(page, '/game/tic-tac-toe');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    for (const i of [4, 0, 2, 6, 3, 5, 1, 8, 7]) {
      await cell(page, i).click();
      if (await page.getByTestId('next-round').isVisible()) break;
    }
    // 4,0,2,6,3,5 then X at 1? X: 4,2,3,1 → 1-4-7 needs 7; O: 0,6,5,8 → no; X plays 7 → win 1-4-7.
    await expect(page.getByTestId('mnk-status')).toContainText('wins!');
    await expect(page.getByTestId('score-x')).toHaveText('1');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'ttt-local-win');
    await page.getByTestId('next-round').click();
    await expect(cell(page, 4)).toHaveAttribute('aria-label', /empty/);
    await expect(page.getByTestId('mnk-status')).toContainText('Player 2');
  });

  test('vs Perfect computer: the human can never win and the round ends', async ({ page }) => {
    await freshStart(page, '/game/tic-tac-toe');
    await page.getByTestId('difficulty-perfect').click();
    await page.getByTestId('start-match').click();
    const status = page.getByTestId('mnk-status');
    for (let move = 0; move < 5; move++) {
      if (await page.getByTestId('next-round').isVisible()) break;
      await expect(status).toContainText('Your turn');
      const empties = page.locator('[data-cell][aria-label$="empty"]');
      await empties.first().click();
      await expect(status).not.toContainText('CPU is thinking', { timeout: 5000 });
    }
    await expect(page.getByTestId('next-round')).toBeVisible();
    await expect(status).not.toContainText('You win');
    const x = Number(await page.getByTestId('score-x').textContent());
    expect(x).toBe(0);
    await screenshot(page, 'ttt-vs-perfect');
  });

  test('keyboard play, rules dialog and resume after reload', async ({ page }) => {
    await freshStart(page, '/game/tic-tac-toe');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    await page.keyboard.press('5');
    await page.keyboard.press('7');
    await expect(cell(page, 4)).toHaveAttribute('aria-label', /X$/);
    await expect(cell(page, 0)).toHaveAttribute('aria-label', /O$/);
    await page.getByRole('button', { name: 'Rules' }).click();
    await expect(page.getByRole('dialog')).toContainText('Get three of your marks in a line');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await page.reload();
    await page.getByTestId('resume-match').click();
    await expect(cell(page, 4)).toHaveAttribute('aria-label', /X$/);
    await expect(cell(page, 0)).toHaveAttribute('aria-label', /O$/);
  });

  test('board fits the viewport without scrolling the page sideways', async ({ page }) => {
    await freshStart(page, '/game/tic-tac-toe');
    await screenshot(page, 'ttt-menu');
    await page.getByTestId('start-match').click();
    const box = await page.getByTestId('mnk-board').boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'ttt-board');
  });

  test('light theme and colorblind palette render the board', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'aal.settings',
        JSON.stringify({
          schema: 1,
          savedAt: 0,
          data: {
            theme: 'light',
            locale: 'es',
            sound: false,
            volume: 0.5,
            motion: 'reduce',
            colorblind: true,
          },
        }),
      );
    });
    await page.goto('./#/game/tic-tac-toe');
    await expect(page.locator('html')).toHaveAttribute('data-colorblind', 'on');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    for (const i of [0, 4, 8, 2, 6, 3, 7]) await cell(page, i).click();
    await expect(page.getByTestId('mnk-status')).toContainText('Gana');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'ttt-light-colorblind-es');
  });
});
