import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('breakout: launch, hold left until every ball is lost', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/breakout?deal=3');
  await page.getByTestId('bo-start').click();
  await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'breakout');
  await page.keyboard.down('ArrowLeft');
  await expect(page.getByTestId('bo-again')).toBeVisible({ timeout: 80_000 });
  await page.keyboard.up('ArrowLeft');
  await expect(page.getByTestId('bo-overlay')).toContainText('Game over');
});

test('breakout: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/breakout?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('bo-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});
