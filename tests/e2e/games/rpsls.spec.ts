import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test("rpsls: throw, hint, and see the computer's read", async ({ page }) => {
  await freshStart(page, '/game/rpsls?deal=3');
  await page.getByTestId('r5-start').click();
  await page.getByTestId('r5-hint').click();
  await expect(page.getByTestId('r5-message')).toContainText('Suggested');
  await page.getByTestId('r5-throw-0').click();
  await expect(page.getByTestId('r5-history').locator('span')).toHaveCount(1);
  await page.getByTestId('r5-reveal').click();
  await expect(page.getByTestId('r5-read')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'rpsls');
});

test('rpsls: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/rpsls?mode=watch&deal=5');
  await expect(page.getByTestId('r5-history').locator('span').nth(1)).toBeVisible({
    timeout: 8000,
  });
});
