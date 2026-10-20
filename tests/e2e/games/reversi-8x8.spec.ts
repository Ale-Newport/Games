import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test.describe('Reversi 8×8', () => {
  test('vs Hard: legal moves, flips, and the CPU replies', async ({ page }) => {
    await freshStart(page, '/game/reversi-8x8');
    await page.getByTestId('difficulty-hard').click();
    await page.getByTestId('start-match').click();
    const status = page.getByTestId('mnk-status');
    for (let turn = 0; turn < 4; turn++) {
      await expect(status).toContainText(/Your turn|wins|draw/, { timeout: 8000 });
      if (await page.getByTestId('next-round').isVisible()) break;
      if (await page.getByTestId('pass-button').isVisible())
        await page.getByTestId('pass-button').click();
      else await page.locator('[data-square][aria-label$="legal move"]').first().click();
    }
    await expect(page.getByTestId('status-info')).toContainText('Black');
    const box = (await page.getByTestId('reversi-board').boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'reversi8-midgame');
  });
});
