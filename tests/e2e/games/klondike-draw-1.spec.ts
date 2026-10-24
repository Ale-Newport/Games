import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const card = (pile: string, i: number) => `[data-pile-card="${pile}:${i}"]`;

test('Klondike Draw One: send an ace home, draw, drag a card, undo', async ({ page }) => {
  await freshStart(page, '/game/klondike-draw-1?deal=3');
  await expect(page.getByTestId('sol-deal')).toHaveText('#3');
  // Deal 3: tap the ace of diamonds twice to send it to a foundation.
  await page.locator(card('t1', 1)).click();
  await page.locator(card('t1', 1)).click();
  await expect(page.locator(card('f0', 0))).toHaveAttribute('aria-label', 'ace of diamonds');
  await expect(page.getByTestId('sol-score')).toHaveText('15');
  await page.locator(card('stock', 23)).click();
  await expect(page.getByTestId('sol-moves')).toHaveText('2');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'klondike-draw-1');
  await page.getByTestId('sol-undo').click();
  await expect(page.getByTestId('sol-moves')).toHaveText('1');
});

test('Klondike Draw One: drag the 8♣ onto the 9♦ (deal 1)', async ({ page }) => {
  await freshStart(page, '/game/klondike-draw-1?deal=1');
  const from = (await page.locator(card('t2', 2)).boundingBox())!;
  const to = (await page.locator(card('t1', 1)).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 3);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 - 10, from.y + from.height / 3 + 4, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(card('t1', 2))).toHaveAttribute('aria-label', 'eight of clubs');
});

test('Klondike Draw One: the computer plays a deal', async ({ page }) => {
  await freshStart(page, '/game/klondike-draw-1?mode=watch');
  await expect(page.getByTestId('sol-status')).toContainText('Watching');
  await expect(page.getByTestId('sol-moves')).not.toHaveText('0', { timeout: 6000 });
});
