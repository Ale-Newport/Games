import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Five Card Draw: bet, pick discards, draw', async ({ page }) => {
  await freshStart(page, '/game/five-card-draw?deal=4');
  await page.getByTestId('poker-opponents-2').click();
  await page.getByTestId('poker-start').click();
  await expect(page.getByTestId('poker-phase')).toHaveText('Before the draw');
  // Call or check until the player's draw (or the hand ends without them).
  for (let k = 0; k < 15; k++) {
    if (await page.getByTestId('poker-draw').isVisible()) break;
    if (await page.getByTestId('poker-next').isVisible()) break;
    const call = page.getByTestId('poker-call');
    if (await call.isVisible()) await call.click();
    await page.waitForTimeout(900);
  }
  if (await page.getByTestId('poker-draw').isVisible()) {
    await page.getByTestId('poker-card-0').click();
    await page.getByTestId('poker-card-4').click();
    await expect(page.getByTestId('poker-draw')).toHaveText('Draw 2');
    await expectNoHorizontalOverflow(page);
    await screenshot(page, 'five-card-draw');
    await page.getByTestId('poker-draw').click();
    await expect(page.getByTestId('poker-drew-0')).toHaveText('drew 2');
  }
});

test('Five Card Draw: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/five-card-draw?mode=watch');
  await expect(page.getByTestId('poker-seat-5')).toBeVisible();
  await expect(page.getByTestId('poker-phase')).toBeVisible();
});
