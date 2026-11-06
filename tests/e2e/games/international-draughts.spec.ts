import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const sq = (r: number, c: number) => r * 10 + c;

test('International draughts: an opening move and the CPU reply', async ({ page }) => {
  await freshStart(page, '/game/international-draughts');
  await page.getByTestId('start-match').click();
  await page.locator(`[data-square="${sq(6, 1)}"]`).click();
  await page.locator(`[data-square="${sq(5, 2)}"]`).click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  const box = (await page.getByTestId('draughts-board').boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'international-draughts');
});
