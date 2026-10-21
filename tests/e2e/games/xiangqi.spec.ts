import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const point = (name: string) => `[data-square="${name}"]`;

test('Xiangqi: a cannon check against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/xiangqi');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const [a, b] of [
    ['h2', 'e2'],
    ['h7', 'e7'],
    ['e2', 'e6'],
  ]) {
    await page.locator(point(a!)).click();
    await page.locator(point(b!)).click();
  }
  await expect(page.getByTestId('status-info')).toHaveText('Check!');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'xiangqi-check');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator(point('h2')).click();
  await page.locator(point('e2')).click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
  await expect(page.getByTestId('move-list')).toContainText('Ch2-e2');
});
