import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Kayles: knock down two pins, then the CPU replies', async ({ page }) => {
  await freshStart(page, '/game/kayles');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  await page.locator('[data-pin="4"]').click();
  await page.locator('[data-pin="5"]').click();
  await expect(page.getByTestId('knock')).toHaveText('Knock down 2 pins');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'kayles');
  await page.getByTestId('knock').click();
  await expect(page.locator('[data-pin="5"]')).toHaveAttribute('aria-label', 'Pin 6, down');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByTestId('mode-ai').click();
  await page.getByTestId('start-match').click();
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  await page.locator('[data-pin][aria-disabled="false"]').last().click();
  await page.getByTestId('knock').click();
  await expect(page.getByTestId('mnk-status')).toContainText(/Your turn|wins|win/, {
    timeout: 8000,
  });
});
