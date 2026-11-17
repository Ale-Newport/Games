import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Word Rank: guess words, take a hint and give up', async ({ page }) => {
  await freshStart(page, '/game/word-rank?deal=7');
  await expect(page.getByTestId('wr-menu')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('wr-random').click();
  for (const w of ['house', 'water', 'music']) {
    await page.getByTestId('wr-input').fill(w);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByTestId('wr-list').locator('li')).toHaveCount(3);
  await page.getByTestId('wr-hint').click();
  await expect(page.getByTestId('wr-list').locator('li')).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'word-rank');
  await page.getByTestId('wr-giveup').click();
  await expect(page.getByTestId('wr-result')).toBeVisible();
});
