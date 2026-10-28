import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hangman: guess letters, see the drawing grow, solve with hints', async ({ page }) => {
  await freshStart(page, '/game/hangman?deal=12');
  await page.getByTestId('hm-lang-en').click();
  await page.getByTestId('hm-cat-animals').click();
  await page.getByTestId('hm-play').click();
  await page.keyboard.press('e');
  await expect(page.getByTestId('hm-key-e')).toBeDisabled();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hangman');
  for (let i = 0; i < 26; i++) {
    if (await page.getByTestId('hm-again').isVisible()) break;
    await page.getByTestId('hm-hint').click();
    await page.getByTestId('hm-apply').click();
  }
  await expect(page.getByTestId('hm-message')).toContainText('Solved with');
});

test('Hangman: two players with a secret word', async ({ page }) => {
  await freshStart(page, '/game/hangman');
  await page.getByTestId('hm-friend-btn').click();
  await page.getByTestId('hm-secret').fill('lighthouse');
  await page.getByTestId('hm-friend-go').click();
  await expect(page.getByTestId('hm-word').locator('span')).toHaveCount(10);
  await page.getByTestId('hm-key-h').click();
  await expect(page.getByTestId('hm-message')).toContainText('H appears 2 times');
});
