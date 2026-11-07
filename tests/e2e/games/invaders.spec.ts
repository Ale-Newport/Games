import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Invaders: fire, then stand still until the last cannon falls', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/invaders?deal=3');
  await page.getByTestId('iv-start').click();
  await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'invaders');
  await expect(page.getByTestId('iv-again')).toBeVisible({ timeout: 80_000 });
  await expect(page.getByTestId('iv-overlay')).toContainText(/Game over|landed/);
});

test('Invaders: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/invaders?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('iv-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});
