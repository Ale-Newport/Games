import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('SOS: spell S-O-S with a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/sos');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="0"]').click();
  await page.locator('[data-cell="2"]').click();
  await page.getByTestId('letter-O').click();
  await page.locator('[data-cell="1"]').click();
  await expect(page.getByTestId('scores')).toHaveText('SOS — Red 1 · Blue 0');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'sos');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-cell][aria-disabled="false"]').first().click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|scored/, { timeout: 8000 });
});
