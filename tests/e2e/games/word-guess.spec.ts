import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Word Guess: type words, read the marks, solve with hints', async ({ page }) => {
  await freshStart(page, '/game/word-guess?deal=42');
  await page.getByTestId('wg-lang-en').click();
  await page.getByTestId('wg-random').click();
  await page.keyboard.type('qzqzq');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('wg-message')).toContainText('not in the word list');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Backspace');
  for (const c of 'about') await page.getByTestId(`wg-key-${c}`).click();
  await page.getByTestId('wg-enter').click();
  await expect(page.getByTestId('wg-row-0').locator('[data-mark]')).toHaveCount(5);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'word-guess');
  for (let i = 0; i < 6; i++) {
    if (await page.getByTestId('wg-again').isVisible()) break;
    await page.getByTestId('wg-hint').click();
    await page.getByTestId('wg-apply').click();
    await page.getByTestId('wg-enter').click();
  }
  await expect(page.getByTestId('wg-message')).toContainText('Solved in');
});

test('Word Guess: watch the AI solve a Spanish word', async ({ page }) => {
  await freshStart(page, '/game/word-guess');
  await page.getByTestId('wg-lang-es').click();
  await page.getByTestId('wg-watch').click();
  await expect(page.getByTestId('wg-message')).toContainText('The AI found', { timeout: 12_000 });
});
