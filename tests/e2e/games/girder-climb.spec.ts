import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Girder Climb: walk, jump and see the bonus run', async ({ page }) => {
  await freshStart(page, '/game/girder-climb?deal=3');
  await page.getByTestId('gc-start').click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('gc-hud-hud.bonus')).toHaveText('4900', { timeout: 5000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'girder-climb');
});

test('Girder Climb: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/girder-climb?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('gc-hud-hud.score').textContent()), {
      timeout: 40_000,
    })
    .toBeGreaterThan(0);
});
