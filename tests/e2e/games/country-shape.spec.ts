import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Country Shape: see the outline and get distance clues', async ({ page }) => {
  await freshStart(page, '/game/country-shape?deal=9');
  await page.getByTestId('cs-random').click();
  await expect(page.getByTestId('silhouette')).toHaveAttribute('data-ready', 'true', {
    timeout: 10_000,
  });
  await page.getByTestId('cs-input').fill('Japan');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cs-row-0')).toContainText(/km/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'country-shape');
});
