import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Star Duel: turn, burn and fire', async ({ page }) => {
  await freshStart(page, '/game/spacewar?deal=1');
  await page.getByTestId('sd-start').click();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'spacewar');
  await expect(page.getByTestId('sd-hud-hud.jumps')).toHaveText('3');
});

test('Star Duel: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/spacewar?mode=watch&deal=2');
  await expect(page.getByTestId('sd-hud-hud.kills')).not.toHaveText('0–0', { timeout: 30_000 });
});
