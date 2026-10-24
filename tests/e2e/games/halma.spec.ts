import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const cell = (x: number, y: number) => `[data-cell="${y * 16 + x}"]`;

test('Halma: step a piece, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/halma');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator(cell(11, 14)).click();
  await expect(page.locator(cell(10, 13))).toHaveAttribute('aria-label', /move here/);
  await page.locator(cell(10, 13)).click();
  await expect(page.locator(cell(10, 13))).toHaveAttribute('aria-label', /Orange/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'halma');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
