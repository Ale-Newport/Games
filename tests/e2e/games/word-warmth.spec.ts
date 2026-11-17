import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Word Warmth: guess, read similarities and give up', async ({ page }) => {
  await freshStart(page, '/game/word-warmth?deal=5');
  await expect(page.getByTestId('ww-menu')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('ww-random').click();
  await expect(page.getByTestId('ww-header')).toContainText(/\d+\.\d\d/);
  for (const w of ['love', 'stone', 'travel']) {
    await page.getByTestId('ww-input').fill(w);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByTestId('ww-table').locator('tbody tr')).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'word-warmth');
  await page.getByTestId('ww-giveup').click();
  await expect(page.getByTestId('ww-result')).toBeVisible();
});
