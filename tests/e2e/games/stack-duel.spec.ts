import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Stack Duel: a versus round against the bot', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/stack-duel?deal=3');
  await page.getByTestId('sd-mode-versus').click();
  await page.getByTestId('sd-bot-easy').click();
  await page.getByTestId('sd-rounds-1').click();
  await page.getByTestId('sd-start').click();
  await expect(page.getByTestId('sd-canvas')).toBeVisible();
  // Move and drop a few pieces with the keyboard.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
  }
  await expect(page.getByTestId('sd-hud-hud.pps')).not.toHaveText('0.00');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'stack-duel');
});

test('Stack Duel: watch the AI battle', async ({ page }) => {
  await freshStart(page, '/game/stack-duel?mode=watch&deal=5');
  await expect(page.getByTestId('sd-canvas')).toBeVisible();
  await expect
    .poll(async () => Number(await page.getByTestId('sd-hud-hud.apm').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});
