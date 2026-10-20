import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const square = (name: string) => `[data-square="${name}"]`;

test('Shogi: a bishop trade with promotion and a drop, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/shogi');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const [a, b] of [
    ['7g', '7f'],
    ['3c', '3d'],
    ['8h', '2b'],
  ]) {
    await page.locator(square(a!)).click();
    await page.locator(square(b!)).click();
  }
  await page.getByTestId('promote-yes').click();
  await page.locator(square('3a')).click();
  await page.locator(square('2b')).click();
  await page.getByTestId('hand-0-B').click();
  await page.locator(square('5e')).click();
  await expect(page.getByTestId('move-list')).toContainText('B*5e');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'shogi-drop');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator(square('7g')).click();
  await page.locator(square('7f')).click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
  await expect(page.getByTestId('move-list')).toContainText('P-7f');
});
