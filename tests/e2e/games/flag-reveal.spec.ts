import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Flag Reveal: a miss lifts one tile', async ({ page }) => {
  await freshStart(page, '/game/flag-reveal?deal=12');
  await page.getByTestId('fr-random').click();
  await expect(page.getByTestId('fr-flag')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('fr-input').fill('Antarctica');
  await page.getByTestId('fr-input').fill('Mongolia');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-open="true"]')).toHaveCount(1);
  await expect(page.getByTestId('fr-row-0')).toContainText(/km/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'flag-reveal');
});
