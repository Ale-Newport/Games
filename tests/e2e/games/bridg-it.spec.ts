import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Gale: build a bridge, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/bridg-it');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-slot="60"]').click();
  await expect(page.locator('[data-slot="60"]')).toHaveAttribute('aria-label', /bridge/);
  await page.locator('[data-slot="48"]').click();
  await expect(page.locator('[data-slot="48"]')).toHaveAttribute('aria-label', /bridge/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'bridg-it');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 10000 });
});
