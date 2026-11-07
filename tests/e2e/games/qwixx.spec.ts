import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Colour Rows: roll, follow a hint, cross a number', async ({ page }) => {
  await freshStart(page, '/game/qwixx?deal=8');
  await page.getByTestId('cr-count-1').click();
  await page.getByTestId('cr-start').click();
  await page.getByTestId('cr-roll').click();
  await page.getByTestId('cr-hint').click();
  await expect(page.getByTestId('cr-message')).toContainText('Suggested');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'qwixx');
  const lit = page.locator('[data-live="true"]').first();
  await lit.click();
  await expect(page.getByTestId('cr-message')).toContainText('You cross');
});

test('Colour Rows: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/qwixx?mode=watch&deal=6');
  await expect(page.locator('[aria-pressed="true"][data-testid^="cr-cell-"]').first()).toBeVisible({
    timeout: 10000,
  });
});
