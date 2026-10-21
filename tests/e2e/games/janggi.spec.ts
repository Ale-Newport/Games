import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const point = (name: string) => `[data-square="${name}"]`;

test('Janggi: a palace move and a pass, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/janggi');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('status-info')).toContainText('Setup — Cho');
  await page.locator(point('e1')).click();
  await page.locator(point('d2')).click();
  await page.getByTestId('pass').click();
  await expect(page.getByTestId('move-list')).toContainText('pass');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'janggi');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator(point('e1')).click();
  await page.locator(point('e2')).click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 12000 });
});
