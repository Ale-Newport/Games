import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Bagh-Chal: place goats, then the CPU tigers reply', async ({ page }) => {
  await freshStart(page, '/game/bagh-chal');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="12"]').click();
  await page.locator('[data-point="0"]').click();
  await page.locator('[data-point="1"]').click();
  await page.locator('[data-point="7"]').click();
  await expect(page.getByTestId('counts')).toHaveText('Goats eaten 0 of 5 · in hand 18');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'bagh-chal');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-point="12"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
