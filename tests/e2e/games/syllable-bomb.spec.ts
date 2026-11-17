import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Syllable Bomb: play a word containing the prompt', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/syllable-bomb');
  await expect(page.getByTestId('sb-menu')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('sb-bots-1').click();
  await page.getByTestId('sb-diff-easy').click();
  await page.getByTestId('sb-start').click();
  const input = page.getByTestId('sb-input');
  await expect(input).toBeEnabled({ timeout: 40_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'syllable-bomb');
  await input.fill('xqzv');
  await input.press('Enter');
  await expect(page.getByTestId('sb-message')).not.toHaveText('');
});
