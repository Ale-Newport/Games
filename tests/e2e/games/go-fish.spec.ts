import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Go Fish: ask an opponent for a rank', async ({ page }) => {
  await freshStart(page, '/game/go-fish?deal=3');
  await page.getByTestId('fish-opponents-3').click();
  await page.getByTestId('fish-start').click();
  await expect(page.getByTestId('fish-opponent-3')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'go-fish');
  await page.getByTestId('fish-hand').locator('button').first().click();
  await page.getByTestId('fish-ask-2').click();
  await expect(page.getByTestId('fish-log')).toContainText('You ask Bruno for');
});

test('Go Fish: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/go-fish?mode=watch');
  await expect(page.getByTestId('fish-opponent-3')).toBeVisible();
  await expect(page.getByTestId('fish-log').locator('li').first()).toBeVisible({ timeout: 5000 });
});
