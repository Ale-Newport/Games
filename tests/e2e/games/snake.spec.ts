import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Classic Snake: steer into a wall and see the end', async ({ page }) => {
  await freshStart(page, '/game/snake?deal=3');
  await page.getByTestId('sn-start').click();
  await page.keyboard.press('ArrowUp');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'snake');
  await expect(page.getByTestId('sn-again')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('sn-overlay')).toContainText('Crashed');
});

test('Classic Snake: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/snake?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('sn-hud-hud.length').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(3);
});
