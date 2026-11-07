import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Chinese Checkers: move a marble, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/chinese-checkers');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-cell="114"]').click();
  await expect(page.locator('[data-cell="105"]')).toHaveAttribute('aria-label', /move here/);
  await page.locator('[data-cell="105"]').click();
  await expect(page.locator('[data-cell="105"]')).toHaveAttribute('aria-label', '5·8, Orange');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'chinese-checkers');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
