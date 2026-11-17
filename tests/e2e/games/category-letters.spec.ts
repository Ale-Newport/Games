import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Category Letters: roll, fill the list and review against bots', async ({ page }) => {
  await freshStart(page, '/game/category-letters?deal=12');
  await page.getByTestId('cl-lang-en').click();
  await page.getByTestId('cl-size-6').click();
  await page.getByTestId('cl-rounds-1').click();
  await page.getByTestId('cl-start').click();
  await expect(page.getByTestId('cl-fill')).toBeVisible({ timeout: 5_000 });
  const letter = (await page.getByTestId('cl-letter').textContent())!.trim();
  await page.getByTestId('cl-input-0').fill(`${letter}andomish`);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'category-letters');
  await page.getByTestId('cl-done-btn').click();
  await expect(page.getByTestId('cl-review')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId('cl-next-round').click();
  await expect(page.getByTestId('cl-winner')).toBeVisible();
});
