import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Paper Soccer: kick, bounce, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/paper-soccer');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-dir="0"]').click();
  await page.locator('[data-dir="2"]').click();
  await page.locator('[data-dir="5"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Bounce! Orange moves again');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'paper-soccer');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
  await page.locator('[data-dir="0"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|Bounce/, {
    timeout: 15000,
  });
});
