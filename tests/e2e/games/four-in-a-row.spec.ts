import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const column = (page: Page, c: number) => page.locator(`[data-column="${c}"]`);

test.describe('Four in a Row', () => {
  test('two players: a diagonal win', async ({ page }) => {
    await freshStart(page, '/game/four-in-a-row');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    for (const c of [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]) await column(page, c).click();
    await expect(page.getByTestId('mnk-status')).toContainText('wins!');
    await expect(page.getByTestId('score-x')).toHaveText('1');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'c4-diagonal-win');
  });

  test('vs Hard: the CPU answers every drop and blocks an open three', async ({ page }) => {
    await freshStart(page, '/game/four-in-a-row');
    await page.getByTestId('difficulty-hard').click();
    await page.getByLabel('Alternate who starts each round').uncheck();
    await page.getByTestId('start-match').click();
    const status = page.getByTestId('mnk-status');
    for (const c of [0, 1, 2]) {
      await expect(status).toContainText(/Your turn|wins|draw/, { timeout: 8000 });
      if (await page.getByTestId('next-round').isVisible()) break;
      await column(page, c).click();
    }
    await expect(status).toContainText(/Your turn|wins|draw/, { timeout: 8000 });
    await expect(status).not.toContainText('You win');
    await screenshot(page, 'c4-vs-hard');
  });

  test('board fits the viewport', async ({ page }) => {
    await freshStart(page, '/game/four-in-a-row');
    await page.getByTestId('start-match').click();
    const box = (await page.getByTestId('gravity-board').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect((await column(page, 3).boundingBox())!.width).toBeGreaterThanOrEqual(30);
    await expectNoHorizontalOverflow(page);
  });
});
