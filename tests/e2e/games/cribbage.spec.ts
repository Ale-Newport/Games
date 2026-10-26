import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Cribbage: throw to the crib and lay a card', async ({ page }) => {
  await freshStart(page, '/game/cribbage?deal=1');
  await page.getByTestId('cribbage-start').click();
  await page.getByTestId('cribbage-hint').click();
  await expect(page.getByTestId('cribbage-throw')).toBeEnabled();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'cribbage');
  await page.getByTestId('cribbage-throw').click();
  await expect(page.getByTestId('cribbage-status')).toHaveText('Your card', { timeout: 6000 });
  await page.getByTestId('cribbage-hand').locator('button:not([disabled])').first().click();
  await expect(page.getByTestId('cribbage-log')).toContainText('You:');
});

test('Cribbage: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/cribbage?mode=watch');
  await expect(page.getByTestId('cribbage-pile').locator('[role="img"]').first()).toBeVisible({
    timeout: 8000,
  });
});
