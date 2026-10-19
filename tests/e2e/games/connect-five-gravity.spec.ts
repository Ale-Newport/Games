import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const column = (page: Page, c: number) => page.locator(`[data-column="${c}"]`);

test.describe('Connect Five Gravity', () => {
  test('two players: five in a row wins and four does not', async ({ page }) => {
    await freshStart(page, '/game/connect-five-gravity');
    await page.getByTestId('mode-local').click();
    await page.getByTestId('start-match').click();
    for (const c of [0, 0, 1, 1, 2, 2, 3, 3]) await column(page, c).click();
    await expect(page.getByTestId('mnk-status')).not.toContainText('wins');
    await column(page, 4).click();
    await expect(page.getByTestId('mnk-status')).toContainText('wins!');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'c5-win');
  });

  test('vs Medium: the CPU answers and the board fits the screen', async ({ page }) => {
    await freshStart(page, '/game/connect-five-gravity');
    await page.getByTestId('start-match').click();
    await column(page, 4).click();
    await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
    const box = (await page.getByTestId('gravity-board').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await expectNoHorizontalOverflow(page);
  });
});
