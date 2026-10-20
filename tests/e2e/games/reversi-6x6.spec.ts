import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Reversi 6×6: play a few moves against Medium', async ({ page }) => {
  await freshStart(page, '/game/reversi-6x6');
  await page.getByTestId('start-match').click();
  const status = page.getByTestId('mnk-status');
  for (let turn = 0; turn < 3; turn++) {
    await expect(status).toContainText(/Your turn|wins|draw/, { timeout: 8000 });
    if (await page.getByTestId('next-round').isVisible()) break;
    if (await page.getByTestId('pass-button').isVisible())
      await page.getByTestId('pass-button').click();
    else await page.locator('[data-square][aria-label$="legal move"]').first().click();
  }
  await expect(page.locator('[data-square]')).toHaveCount(36);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'reversi6');
});
