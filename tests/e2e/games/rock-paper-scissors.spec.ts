import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test("rock-paper-scissors: throw, hint, and see the computer's read", async ({ page }) => {
  await freshStart(page, '/game/rock-paper-scissors?deal=3');
  await page.getByTestId('rp-start').click();
  await page.getByTestId('rp-hint').click();
  await expect(page.getByTestId('rp-message')).toContainText('Suggested');
  await page.getByTestId('rp-throw-0').click();
  await expect(page.getByTestId('rp-history').locator('span')).toHaveCount(1);
  await page.getByTestId('rp-reveal').click();
  await expect(page.getByTestId('rp-read')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'rock-paper-scissors');
});

test('rock-paper-scissors: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/rock-paper-scissors?mode=watch&deal=5');
  await expect(page.getByTestId('rp-history').locator('span').nth(1)).toBeVisible({
    timeout: 8000,
  });
});
