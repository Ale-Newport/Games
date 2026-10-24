import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Lines of Action: move a piece by the line count, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/lines-of-action');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="1"]').click();
  await page.locator('[data-cell="17"]').click();
  await expect(page.locator('[data-cell="17"]')).toHaveAttribute('aria-label', 'b6, Black');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'lines-of-action');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
