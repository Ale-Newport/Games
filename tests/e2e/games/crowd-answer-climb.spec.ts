import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Crowd Answer Climb: three tries per prompt', async ({ page }) => {
  await freshStart(page, '/game/crowd-answer-climb?deal=9');
  await page.getByTestId('sv-lang-es').click();
  await page.getByTestId('sv-unlimited').click();
  await expect(page.getByTestId('sv-input')).toBeEnabled({ timeout: 5_000 });
  for (const w of ['qqqq', 'zzzz', 'xxxx']) {
    await page.getByTestId('sv-input').fill(w);
    await page.keyboard.press('Enter');
  }
  await expect(page.getByTestId('sv-timeout')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'crowd-answer-climb');
});

test('Crowd Answer Climb: a party hands the device over', async ({ page }) => {
  await freshStart(page, '/game/crowd-answer-climb');
  await page.getByTestId('sv-players').selectOption('3');
  await page.getByTestId('sv-party').click();
  await expect(page.getByTestId('sv-pass')).toBeVisible();
  await page.getByTestId('sv-ready').click();
  await expect(page.getByTestId('sv-question')).toBeVisible();
});
