import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Maze Chase: steer and eat seeds', async ({ page }) => {
  await freshStart(page, '/game/maze-chase?deal=3');
  await page.getByTestId('mc-start').click();
  await page.keyboard.down('ArrowLeft');
  await expect
    .poll(async () => Number(await page.getByTestId('mc-hud-hud.score').textContent()), {
      timeout: 10_000,
    })
    .toBeGreaterThan(0);
  await page.keyboard.up('ArrowLeft');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'maze-chase');
});

test('Maze Chase: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/maze-chase?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('mc-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(200);
});
