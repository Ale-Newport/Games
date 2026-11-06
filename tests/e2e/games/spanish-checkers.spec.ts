import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Spanish checkers: an opening move and the CPU reply', async ({ page }) => {
  await freshStart(page, '/game/spanish-checkers');
  await page.getByTestId('start-match').click();
  await page.locator('[data-square][aria-label$="can move"]').first().click();
  await page.locator('[data-square][aria-label$="move here"]').first().click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'spanish-checkers');
});
