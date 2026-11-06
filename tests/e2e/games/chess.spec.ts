import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const square = (name: string) => `[data-square="${name}"]`;

test('Chess: a quick mate against a friend, then the CPU replies on the clock', async ({
  page,
}) => {
  await freshStart(page, '/game/chess');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  // Fool's mate: 1. f3 e5 2. g4 Qh4#
  for (const [a, b] of [
    ['f2', 'f3'],
    ['e7', 'e5'],
    ['g2', 'g4'],
    ['d8', 'h4'],
  ]) {
    await page.locator(square(a!)).click();
    await page.locator(square(b!)).click();
  }
  await expect(page.getByTestId('mnk-status')).toContainText('Player 2 wins');
  await expect(page.getByTestId('mnk-status')).toContainText('Checkmate');
  await expect(page.getByTestId('move-list')).toContainText('Qh4#');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'chess-mate');

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('clock-5+0').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('clock-0')).toHaveText(/^4:5\d|5:00$/);
  // Drag e2 to e4.
  const from = await page.locator(square('e2')).boundingBox();
  const to = await page.locator(square('e4')).boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator(square('e4'))).toHaveAttribute('aria-label', 'e4, white pawn');
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await expect(page.getByTestId('move-list')).toContainText('1.e4');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'chess-clock');
});
