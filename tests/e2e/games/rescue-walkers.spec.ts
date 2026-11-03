import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Wanderer Rescue: pick a level, switch skills and end it early', async ({ page }) => {
  await freshStart(page, '/game/rescue-walkers?deal=1');
  await page.getByTestId('wr-start-2').click();
  await page.getByTestId('wr-start').click();
  await expect(page.getByTestId('wr-hud-hud.level')).toHaveText('2/6');
  await page.waitForTimeout(2500);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'rescue-walkers');
  await page.getByTestId('wr-pad-alt').click();
  await expect(page.getByTestId('wr-hud-hud.lives')).toHaveText('2', { timeout: 5_000 });
});

test('Wanderer Rescue: watch the AI clear the first level', async ({ page }) => {
  await freshStart(page, '/game/rescue-walkers?mode=watch&deal=2');
  await expect(page.getByTestId('wr-hud-hud.level')).toHaveText('2/6', { timeout: 40_000 });
});
