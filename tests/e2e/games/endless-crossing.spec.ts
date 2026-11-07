import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Endless Crossing: hop forward', async ({ page }) => {
  await freshStart(page, '/game/endless-crossing?deal=3');
  await page.getByTestId('ec-start').click();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByTestId('ec-hud-hud.rows')).not.toHaveText('0');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'endless-crossing');
});

test('Endless Crossing: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/endless-crossing?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('ec-hud-hud.rows').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(5);
});
