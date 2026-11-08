import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Nebula Strike: fly, shoot and bomb', async ({ page }) => {
  await freshStart(page, '/game/vertical-shmup?deal=1');
  await page.getByTestId('ns-start').click();
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('x');
  await expect(page.getByTestId('ns-hud-hud.bombs')).toHaveText('2');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'vertical-shmup');
});

test('Nebula Strike: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/vertical-shmup?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('ns-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});
