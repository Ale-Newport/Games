import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Summit Rush: roll, follow hints, climb and stop', async ({ page }) => {
  await freshStart(page, '/game/cant-stop?deal=5');
  await page.getByTestId('sr-level-easy').click();
  await page.getByTestId('sr-start').click();
  await page.getByTestId('sr-roll').click();
  await expect(page.getByTestId('sr-opt-0')).toBeVisible();
  await page.getByTestId('sr-hint').click();
  await expect(page.getByTestId('sr-message')).toContainText('Suggested: climb');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'cant-stop');
  await page.locator('[data-testid^="sr-opt-"].btn-primary').click();
  await expect(page.locator('[data-climber]').first()).toBeVisible();
  await page.getByTestId('sr-stop').click();
  await expect(page.getByTestId('sr-message')).toContainText('You stop');
});

test('Summit Rush: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/cant-stop?mode=watch&deal=6');
  await expect(page.locator('[data-climber]').first()).toBeVisible({ timeout: 8000 });
});
