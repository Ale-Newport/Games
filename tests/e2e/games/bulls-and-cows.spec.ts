import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Bulls and Cows: type a guess, read bulls and cows, crack it with hints', async ({ page }) => {
  await freshStart(page, '/game/bulls-and-cows?deal=17');
  await page.getByTestId('bc-solo').click();
  for (const d of [0, 1, 2, 3]) await page.getByTestId(`bc-key-${d}`).click();
  await page.getByTestId('bc-enter').click();
  await expect(page.getByTestId('bc-you-row-0')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'bulls-and-cows');
  for (let i = 0; i < 12; i++) {
    if (await page.getByTestId('bc-again').isVisible()) break;
    await page.getByTestId('bc-hint').click();
    await page.getByTestId('bc-apply').click();
    await page.getByTestId('bc-enter').click();
  }
  await expect(page.getByTestId('bc-message')).toContainText('Cracked in');
});

test('Bulls and Cows: a duel turn against the computer', async ({ page }) => {
  await freshStart(page, '/game/bulls-and-cows');
  await page.getByTestId('bc-duel').click();
  await page.getByTestId('bc-pick-random').click();
  await page.getByTestId('bc-pick-go').click();
  for (const d of [5, 6, 7, 8]) await page.getByTestId(`bc-key-${d}`).click();
  await page.getByTestId('bc-enter').click();
  await expect(page.getByTestId('bc-ai-row-0')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('bc-message')).toContainText('The computer guessed');
});
