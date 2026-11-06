import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const square = (name: string) => `[data-square="${name}"]`;

test('Animal shogi: chick trade and a drop, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/dobutsu-shogi');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.locator('[data-square]')).toHaveCount(12);
  await page.locator(square('2c')).click();
  await page.locator(square('2b')).click();
  await page.locator(square('2a')).click();
  await page.locator(square('2b')).click();
  await page.getByTestId('hand-0-C').click();
  await page.locator(square('2c')).click();
  await expect(page.getByTestId('move-list')).toContainText('C*2c');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'animal-shogi');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator(square('2c')).click();
  await page.locator(square('2b')).click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|wins/, { timeout: 8000 });
});
