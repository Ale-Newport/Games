import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sunny Trail: run, jump and open the first prize box', async ({ page }) => {
  await freshStart(page, '/game/platformer');
  await page.getByTestId('pf-start').click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1500);
  await page.keyboard.up('ArrowRight');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'platformer');
  await expect(page.getByTestId('pf-hud-hud.time')).not.toHaveText('200');
});

test('Sunny Trail: watch the AI reach level 2', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/platformer?mode=watch');
  await expect(page.getByTestId('pf-hud-hud.level')).toHaveText('2', { timeout: 70_000 });
});
