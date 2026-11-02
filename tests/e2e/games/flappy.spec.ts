import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Puffin Flap: flap once and splash down', async ({ page }) => {
  await freshStart(page, '/game/flappy?deal=1');
  await page.getByTestId('fp-start').click();
  await page.getByTestId('fp-canvas').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'flappy');
  await expect(page.getByTestId('fp-overlay')).toContainText('Splash', { timeout: 10_000 });
});

test('Puffin Flap: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/flappy?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('fp-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(3);
});
