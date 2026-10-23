import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Clobber: clobber a stone with a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/clobber');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="14"]').click();
  await expect(page.locator('[aria-label$=", clobber"]')).toHaveCount(4);
  await page.locator('[data-cell="15"]').click();
  await page.locator(`[data-cell="22"]`).click();
  await page.locator(`[data-cell="16"]`).click();
  await expect(page.getByTestId('counts')).toHaveText('White 17 · Black 17');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'clobber');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-cell="14"]').click();
  await page.locator('[aria-label$=", clobber"]').first().click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
});
