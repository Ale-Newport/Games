import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Rare Answer Dive: answer, miss, reveal and keep diving', async ({ page }) => {
  await freshStart(page, '/game/rare-answer-dive?deal=42');
  await page.getByTestId('sv-lang-en').click();
  await page.getByTestId('sv-unlimited').click();
  await expect(page.getByTestId('sv-question')).toBeVisible();
  await expect(page.getByTestId('sv-input')).toBeEnabled({ timeout: 5_000 });
  await page.getByTestId('sv-input').fill('qqqq zzzz');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('sv-feedback')).toContainText('No echo');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'rare-answer-dive');
  await expect(page.getByTestId('sv-reveal')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('sv-next').click();
  await expect(page.getByTestId('sv-question')).toBeVisible();
});

test('Rare Answer Dive: watch the AI dive', async ({ page }) => {
  await freshStart(page, '/game/rare-answer-dive?mode=watch&deal=5');
  await expect(page.getByTestId('sv-reveal')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('sv-score')).not.toHaveText('0 m', { timeout: 20_000 });
});
