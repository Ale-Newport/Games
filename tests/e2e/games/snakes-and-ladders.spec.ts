import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Snakes and Ladders: Choice game — roll, take a hint, pick a die', async ({ page }) => {
  await freshStart(page, '/game/snakes-and-ladders?deal=5');
  await page.getByTestId('sl-variant-choice').click();
  await page.getByTestId('sl-start').click();
  await expect(page.getByTestId('sl-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'snakes-and-ladders');
  for (let turn = 0; turn < 3; turn++) {
    await page.getByTestId('sl-roll').click();
    await page.getByTestId('sl-hint').click();
    await expect(page.getByTestId('sl-message')).toContainText('Suggested');
    await page.getByTestId('sl-die-0').click();
    await expect(page.getByTestId('sl-roll')).toBeVisible({ timeout: 5000 });
  }
  await expect(page.getByTestId('sl-player-0')).not.toContainText('· 0');
});

test('Snakes and Ladders: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/snakes-and-ladders?mode=watch&deal=3');
  await expect(page.getByTestId('sl-player-0')).not.toContainText('· 0', { timeout: 8000 });
});
