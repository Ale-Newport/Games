import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Space Rocks: fire, then drift until the last ship is lost', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/asteroids?deal=3');
  await page.getByTestId('sr2-start').click();
  await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'asteroids');
  await expect(page.getByTestId('sr2-again')).toBeVisible({ timeout: 80_000 });
  await expect(page.getByTestId('sr2-overlay')).toContainText(/Game over/);
});

test('Space Rocks: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/asteroids?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('sr2-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});
