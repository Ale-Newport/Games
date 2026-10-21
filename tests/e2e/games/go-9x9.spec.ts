import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Go 9×9: stones against a friend, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/go-9x9');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await expect(page.locator('[data-point]')).toHaveCount(81);
  await page.locator('[data-point="40"]').click();
  await page.locator('[data-point="42"]').click();
  await expect(page.locator('[data-point="40"]')).toHaveAttribute('aria-label', /black stone/);
  await page.getByTestId('pass').click();
  await page.getByTestId('pass').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Area count');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'go-9');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-point="40"]').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 15000 });
});
