import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Spike Hop: run into the spikes and come back', async ({ page }) => {
  await freshStart(page, '/game/precision-platformer');
  await page.getByTestId('pp-start').click();
  await page.keyboard.down('ArrowRight');
  await expect(page.getByTestId('pp-hud-hud.deaths')).toHaveText('1', { timeout: 5000 });
  await page.keyboard.up('ArrowRight');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'precision-platformer');
});

test('Spike Hop: watch the AI clear rooms', async ({ page }) => {
  await freshStart(page, '/game/precision-platformer?mode=watch');
  await expect(page.getByTestId('pp-hud-hud.room')).toHaveText('4/8', { timeout: 30_000 });
});
