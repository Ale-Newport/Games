import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Circuit Sprint: pick the loop and pull away', async ({ page }) => {
  await freshStart(page, '/game/top-down-racing?deal=1');
  await page.getByTestId('tr-track-loop').click();
  await page.getByTestId('tr-start').click();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowUp');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'top-down-racing');
  await expect
    .poll(async () => Number(await page.getByTestId('tr-hud-hud.time').textContent()))
    .toBeGreaterThan(0);
});

test('Circuit Sprint: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/top-down-racing?mode=watch&deal=2');
  await expect(page.getByTestId('tr-hud-hud.lap')).toHaveText('2/3', { timeout: 30_000 });
});
