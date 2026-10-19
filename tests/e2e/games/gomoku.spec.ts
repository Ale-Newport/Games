import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const point = (page: Page, i: number) => page.locator(`[data-point="${i}"]`);
const at = (r: number, c: number) => r * 15 + c;

test.describe('Gomoku', () => {
  test('two players: five in a row wins', async ({ page, isMobile }) => {
    await freshStart(page, '/game/gomoku');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    const moves = [
      at(7, 3),
      at(8, 3),
      at(7, 4),
      at(8, 4),
      at(7, 5),
      at(8, 5),
      at(7, 6),
      at(8, 6),
      at(7, 7),
    ];
    for (const m of moves) {
      // Touch screens preview on the first tap and place on the second.
      if (isMobile) {
        await point(page, m).tap();
        await expect(page.getByText('Tap again to place')).toBeVisible();
        await point(page, m).tap();
      } else {
        await point(page, m).click();
      }
    }
    await expect(page.getByTestId('mnk-status')).toContainText('wins!');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'gomoku-win');
  });

  test('vs Hard: the CPU answers in the center area and the board fits', async ({
    page,
    isMobile,
  }) => {
    await freshStart(page, '/game/gomoku');
    await page.getByTestId('difficulty-hard').click();
    await page.getByTestId('start-match').click();
    if (isMobile) {
      await point(page, at(7, 7)).tap();
      await point(page, at(7, 7)).tap();
    } else {
      await point(page, at(7, 7)).click();
    }
    await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
    expect(await page.locator('[data-point][aria-label$="white stone"]').count()).toBe(1);
    const box = (await page.getByTestId('go-board').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'gomoku-vs-hard');
  });
});
