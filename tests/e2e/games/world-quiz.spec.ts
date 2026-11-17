import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('World Quiz: type countries of Europe onto the map', async ({ page }) => {
  await freshStart(page, '/game/world-quiz');
  await page.getByTestId('qz-lang-en').click();
  await page.getByTestId('qz-start-countries-eu').click();
  await expect(page.getByTestId('qz-map')).toBeVisible({ timeout: 10_000 });
  for (const w of ['Spain', 'France', 'Germany', 'Italy'])
    await page.getByTestId('qz-input').fill(w);
  await expect(page.getByTestId('qz-score')).toContainText('4/');
  await expect(page.locator('[data-iso="ES"]').first()).toHaveAttribute('data-tone', 'found');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'world-quiz');
});

test('World Quiz: click the named country', async ({ page }) => {
  await freshStart(page, '/game/world-quiz?quiz=click-americas');
  await expect(page.getByTestId('qz-map')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('qz-prompt')).toContainText(/Click|Haz clic/);
});
