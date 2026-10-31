import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Riichi mahjong: discard by hint and watch the computers reply', async ({ page }) => {
  await freshStart(page, '/game/riichi-mahjong?deal=3');
  await page.getByTestId('rm-start').click();
  await expect(page.getByTestId('rm-hand').locator('button')).toHaveCount(14);
  await page.getByTestId('rm-hint').click();
  await expect(page.getByTestId('rm-message')).toContainText('Suggested');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'riichi-mahjong');
  await page.locator('[data-testid^="rm-tile-"][class*="hinted"]').click();
  await expect(page.getByTestId('rm-discards-0').locator('svg')).toHaveCount(1);
  // The three computer seats discard in turn.
  await expect(page.getByTestId('rm-discards-3').locator('svg').first()).toBeVisible({
    timeout: 8000,
  });
});

test('Riichi mahjong: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/riichi-mahjong?mode=watch&deal=4');
  await expect(page.getByTestId('rm-discards-1').locator('svg').first()).toBeVisible({
    timeout: 8000,
  });
});
