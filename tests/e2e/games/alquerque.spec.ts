import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Alquerque: a forced capture, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/alquerque');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="17"]').click();
  await page.locator('[data-point="12"]').click();
  await expect(page.getByTestId('status-info')).toHaveText(
    'A capture is available: you must capture',
  );
  await page.locator('[data-point="7"]').click();
  await page.locator('[data-point="17"]').click();
  await expect(page.getByTestId('counts')).toHaveText('White 11 · Black 12');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'alquerque');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-point="17"]').click();
  await page.locator('[data-point="12"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
