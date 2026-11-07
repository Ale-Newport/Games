import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Memory Pairs: turn cards over and take a pair by hint', async ({ page }) => {
  await freshStart(page, '/game/memory-pairs?deal=6');
  await page.getByTestId('mp-opp-solo').click();
  await page.getByTestId('mp-start').click();
  await page.getByTestId('mp-card-0').click();
  await page.getByTestId('mp-card-1').click();
  await expect(page.getByTestId('mp-player-0')).toContainText('1');
  await page.getByTestId('mp-hint').click();
  await expect(page.getByTestId('mp-message')).toContainText('Suggested');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'memory-pairs');
  await page.locator('[data-testid^="mp-card-"][class*="hinted"]').click();
  await expect(page.locator('[data-up="true"]').first()).toBeVisible();
});

test('Memory Pairs: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/memory-pairs?mode=watch&deal=5');
  await expect(page.locator('[data-up="true"]').first()).toBeVisible({ timeout: 8000 });
});
