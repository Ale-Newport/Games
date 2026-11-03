import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Sky Lances: flap into the air', async ({ page }) => {
  await freshStart(page, '/game/joust?deal=1');
  await page.getByTestId('sl-start').click();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'joust');
  await expect(page.getByTestId('sl-hud-hud.lives')).toHaveText('3');
});

test('Sky Lances: watch the AI joust', async ({ page }) => {
  await freshStart(page, '/game/joust?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('sl-hud-hud.score').textContent()), {
      timeout: 40_000,
    })
    .toBeGreaterThan(0);
});
