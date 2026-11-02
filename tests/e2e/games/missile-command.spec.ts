import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('City Shield: tap the sky to fire an interceptor', async ({ page }) => {
  await freshStart(page, '/game/missile-command?deal=1');
  await page.getByTestId('mc2-start').click();
  const canvas = page.getByTestId('mc2-canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width / 2, y: box.height / 3 } });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'missile-command');
  await expect(page.getByTestId('mc2-hud-hud.wave')).toHaveText('1');
});

test('City Shield: watch the AI defend', async ({ page }) => {
  await freshStart(page, '/game/missile-command?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('mc2-hud-hud.score').textContent()), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
});
