import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Code Breaker: compose a guess, read the score, crack it with hints', async ({ page }) => {
  await freshStart(page, '/game/code-breaker?deal=21');
  await page.getByTestId('cb-start').click();
  for (const c of [0, 0, 1, 1]) await page.getByTestId(`cb-color-${c}`).click();
  await page.getByTestId('cb-check').click();
  await expect(page.getByTestId('cb-row-0')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'code-breaker');
  for (let i = 0; i < 8; i++) {
    if (await page.getByTestId('cb-again').isVisible()) break;
    await page.getByTestId('cb-hint').click();
    await page.getByTestId('cb-apply').click();
    await page.getByTestId('cb-check').click();
  }
  await expect(page.getByTestId('cb-message')).toContainText('Cracked in');
});

test('Code Breaker: the AI cracks a code you set', async ({ page }) => {
  await freshStart(page, '/game/code-breaker');
  await page.getByTestId('cb-set').click();
  await page.getByTestId('cb-set-random').click();
  await page.getByTestId('cb-set-go').click();
  await expect(page.getByTestId('cb-message')).toContainText('cracked the code', {
    timeout: 10_000,
  });
});
