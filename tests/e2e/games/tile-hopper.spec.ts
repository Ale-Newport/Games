import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Cube Hopper: hop and colour a cube', async ({ page }) => {
  await freshStart(page, '/game/tile-hopper?deal=1');
  await page.getByTestId('th-start').click();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('th-hud-hud.score')).toHaveText('25');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'tile-hopper');
});

test('Cube Hopper: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/tile-hopper?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('th-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(100);
});
