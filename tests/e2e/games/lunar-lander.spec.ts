import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Moon Touchdown: fire the engine and see the fuel drop', async ({ page }) => {
  await freshStart(page, '/game/lunar-lander?deal=1');
  await page.getByTestId('ll-start').click();
  await page.keyboard.down('Space');
  await page.waitForTimeout(500);
  await page.keyboard.up('Space');
  await expect
    .poll(async () => Number(await page.getByTestId('ll-hud-hud.fuel').textContent()))
    .toBeLessThan(1500);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'lunar-lander');
});

test('Moon Touchdown: watch the AI land', async ({ page }) => {
  await freshStart(page, '/game/lunar-lander?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('ll-hud-hud.score').textContent()), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
});
