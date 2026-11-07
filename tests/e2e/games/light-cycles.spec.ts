import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Neon Trails: three rivals, turn and race', async ({ page }) => {
  await freshStart(page, '/game/light-cycles?deal=1');
  await page.getByTestId('lc-rivals-3').click();
  await page.getByTestId('lc-start').click();
  await page.keyboard.press('ArrowDown');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'light-cycles');
  await expect
    .poll(async () => Number(await page.getByTestId('lc-hud-hud.score').textContent()))
    .toBeGreaterThan(5);
});

test('Neon Trails: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/light-cycles?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('lc-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(50);
});
