import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Contract Bridge: bid, reach a contract and play a card', async ({ page }) => {
  await freshStart(page, '/game/contract-bridge?deal=2');
  await page.getByTestId('bridge-start').click();
  await expect(page.getByTestId('bridge-box')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'contract-bridge');
  await page.getByTestId('bridge-bid:1D').click();
  await expect(page.getByTestId('bridge-pass')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('bridge-pass').click();
  await expect(page.getByTestId('bridge-contract')).toBeVisible({ timeout: 8000 });
  const playable = page.getByTestId('trick-hand').locator('button:not([disabled])');
  await expect(playable.first()).toBeVisible({ timeout: 8000 });
  await playable.first().click();
  await expect(page.getByTestId('trick-hand').locator('button')).toHaveCount(12);
});

test('Contract Bridge: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/contract-bridge?mode=watch');
  await expect(page.getByTestId('bridge-auction')).toBeVisible();
  await expect(page.getByTestId('trick-cards').locator('[role="img"]').first()).toBeVisible({
    timeout: 15000,
  });
});
