import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Ludo: roll and move tokens against the computer', async ({ page }) => {
  await freshStart(page, '/game/ludo?deal=8');
  await page.getByTestId('ld-count-2').click();
  await page.getByTestId('ld-start').click();
  await expect(page.getByTestId('cx-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'ludo');
  let moved = 0;
  for (let i = 0; i < 60 && moved < 2; i++) {
    if (await page.getByTestId('ld-roll').isVisible()) await page.getByTestId('ld-roll').click();
    const token = page.locator('[data-movable]');
    if ((await token.count()) > 0) {
      if (moved === 1) {
        await page.getByTestId('ld-hint').click();
        await expect(page.getByTestId('ld-message')).toContainText('Suggested');
      }
      await token.first().click();
      moved++;
    }
    await page.waitForTimeout(600);
  }
  expect(moved).toBe(2);
});

test('Ludo: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/ludo?mode=watch&deal=4');
  await expect(page.getByTestId('ld-die')).not.toHaveText('·', { timeout: 8000 });
});
