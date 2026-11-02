import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Hedgehog Crossing: hop forward', async ({ page }) => {
  await freshStart(page, '/game/crossing?deal=3');
  await page.getByTestId('cr-start').click();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByTestId('cr-hud-hud.score')).not.toHaveText('0');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'crossing');
});

test('Hedgehog Crossing: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/crossing?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('cr-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(5);
});
