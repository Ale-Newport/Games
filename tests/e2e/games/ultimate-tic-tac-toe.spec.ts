import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const cell = (page: Page, i: number) => page.locator(`[data-cell="${i}"]`);
const at = (board: number, c: number) => board * 9 + c;

test.describe('Ultimate Tic-Tac-Toe', () => {
  test('two players: sending rule, board capture and free choice', async ({ page }) => {
    await freshStart(page, '/game/ultimate-tic-tac-toe');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    const board = page.getByTestId('uttt-board');
    // X takes board 4 (cells 0,1,2) while O is shuttled through boards 0,1,2 and back to 4.
    for (const i of [at(4, 0), at(0, 4), at(4, 1), at(1, 4), at(4, 2)]) await cell(page, i).click();
    await expect(page.locator('[data-board="4"]')).toHaveAttribute('data-status', '1');
    // X's last move sent O to board 2.
    await expect(board).toHaveAttribute('data-forced', '2');
    // O plays cell 4 of board 2, sending X to the captured center board → free choice.
    await cell(page, at(2, 4)).click();
    await expect(board).toHaveAttribute('data-forced', '-1');
    await expect(page.locator('[data-playable="true"]')).toHaveCount(8);
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'uttt-capture');
  });

  test('vs Easy: the CPU always answers in the board it was sent to', async ({ page }) => {
    await freshStart(page, '/game/ultimate-tic-tac-toe');
    await page.getByTestId('difficulty-easy').click();
    await page.getByTestId('start-match').click();
    const status = page.getByTestId('mnk-status');
    for (let turn = 0; turn < 6; turn++) {
      await expect(status).toContainText(/Your turn|wins|draw/, { timeout: 5000 });
      if (await page.getByTestId('next-round').isVisible()) break;
      const forced = Number(await page.getByTestId('uttt-board').getAttribute('data-forced'));
      const target = page.locator(
        forced >= 0
          ? `[data-board="${forced}"] [data-cell][aria-label$="empty"]`
          : '[data-playable="true"] [data-cell][aria-label$="empty"]',
      );
      await target.first().click();
      await expect(status).toContainText(/Your turn|wins|draw/, { timeout: 5000 });
    }
    expect(await page.locator('[data-cell][aria-label$=" O"]').count()).toBeGreaterThanOrEqual(5);
    await screenshot(page, 'uttt-vs-easy');
  });

  test('board fits the viewport with tappable cells', async ({ page }) => {
    await freshStart(page, '/game/ultimate-tic-tac-toe');
    await page.getByTestId('start-match').click();
    const box = (await page.getByTestId('uttt-board').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const cellBox = (await cell(page, 40).boundingBox())!;
    expect(cellBox.width).toBeGreaterThanOrEqual(28);
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'uttt-start');
  });
});
