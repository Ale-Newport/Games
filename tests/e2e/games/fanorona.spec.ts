import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Fanorona: capture by approach, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/fanorona');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('status-info')).toHaveText(
    'A capture is available: you must capture',
  );
  await page.locator('[data-point="31"]').click();
  await page.locator('[data-point="22"]').click();
  await expect(page.getByTestId('counts')).toHaveText('White 22 · Black 20');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'fanorona');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-point="31"]').click();
  await page.locator('[data-point="22"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|Keep capturing/, {
    timeout: 8000,
  });
});
