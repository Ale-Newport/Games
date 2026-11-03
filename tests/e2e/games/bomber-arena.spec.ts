import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Blast Arena: walk and drop a bomb', async ({ page }) => {
  await freshStart(page, '/game/bomber-arena?deal=1');
  await page.getByTestId('ba-start').click();
  await page.keyboard.press('Space');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowDown');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'bomber-arena');
  await expect(page.getByTestId('ba-hud-hud.time')).not.toHaveText('120');
});

test('Blast Arena: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/bomber-arena?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('ba-hud-hud.score').textContent()), {
      timeout: 30_000,
    })
    .toBeGreaterThan(0);
});
