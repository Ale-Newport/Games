import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('brick-breaker: launch, hold left until every ball is lost', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/brick-breaker?deal=3');
  await page.getByTestId('bb-start').click();
  await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'brick-breaker');
  await page.keyboard.down('ArrowLeft');
  await expect(page.getByTestId('bb-again')).toBeVisible({ timeout: 80_000 });
  await page.keyboard.up('ArrowLeft');
  await expect(page.getByTestId('bb-overlay')).toContainText('Game over');
});

test('brick-breaker: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/brick-breaker?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('bb-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});
