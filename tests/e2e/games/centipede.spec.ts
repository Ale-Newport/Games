import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Garden Guard: squirt and score', async ({ page }) => {
  await freshStart(page, '/game/centipede?deal=1');
  await page.getByTestId('gg-start').click();
  await page.keyboard.down('Space');
  await expect
    .poll(async () => Number(await page.getByTestId('gg-hud-hud.score').textContent()), {
      timeout: 10_000,
    })
    .toBeGreaterThan(0);
  await page.keyboard.up('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'centipede');
});

test('Garden Guard: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/centipede?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('gg-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(50);
});
