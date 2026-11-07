import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Gem Digger: dig a tunnel', async ({ page }) => {
  await freshStart(page, '/game/boulder-dig?deal=1');
  await page.getByTestId('bd-start').click();
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowDown');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'boulder-dig');
  await expect(page.getByTestId('bd-hud-hud.time')).not.toHaveText('150');
});

test('Gem Digger: watch the AI collect gems', async ({ page }) => {
  await freshStart(page, '/game/boulder-dig?mode=watch&deal=1');
  await expect
    .poll(async () => Number(await page.getByTestId('bd-hud-hud.score').textContent()), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
});
