import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Canyon Run: fly and fire, and the fuel burns', async ({ page }) => {
  await freshStart(page, '/game/river-raid?deal=1');
  await page.getByTestId('cr2-start').click();
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'river-raid');
  await expect
    .poll(async () => Number(await page.getByTestId('cr2-hud-hud.fuel').textContent()))
    .toBeLessThan(100);
});

test('Canyon Run: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/river-raid?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('cr2-hud-hud.score').textContent()), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
});
