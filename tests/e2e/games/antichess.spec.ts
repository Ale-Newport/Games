import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const square = (name: string) => `[data-square="${name}"]`;

test('Antichess: a forced capture against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/antichess');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const [a, b] of [
    ['e2', 'e3'],
    ['b7', 'b5'],
    ['f1', 'b5'],
  ]) {
    await page.locator(square(a!)).click();
    await page.locator(square(b!)).click();
  }
  await expect(page.getByTestId('move-list')).toContainText('2.Bxb5');
  await expect(page.getByTestId('status-info')).toContainText('Black 15');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'antichess');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator(square('e2')).click();
  await page.locator(square('e3')).click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await expect(page.getByTestId('move-list')).toContainText('1.e3');
});
