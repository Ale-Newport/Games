import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Clock: turn and place cards', async ({ page }) => {
  await freshStart(page, '/game/clock-solitaire?deal=5');
  await page.locator('[data-pile-card="h12:3"]').click();
  await page.locator('[data-pile-card="hand:0"]').click();
  await expect(page.getByTestId('sol-score')).toHaveText('1');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'clock-solitaire');
});

test('Clock: the dealer plays a deal', async ({ page }) => {
  await freshStart(page, '/game/clock-solitaire?mode=watch');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
