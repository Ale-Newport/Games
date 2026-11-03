import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Bubble Cannon: aim, swap and fire', async ({ page }) => {
  await freshStart(page, '/game/bubble-shooter?deal=1');
  await page.getByTestId('bq-start').click();
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.press('Shift');
  await page.keyboard.press('Space');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'bubble-shooter');
  // The shot either pops (the score rises) or counts down to a new row.
  await expect
    .poll(async () => {
      const row = await page.getByTestId('bq-hud-hud.row').textContent();
      const score = await page.getByTestId('bq-hud-hud.score').textContent();
      return row !== '7' || score !== '0';
    })
    .toBe(true);
});

test('Bubble Cannon: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/bubble-shooter?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('bq-hud-hud.score').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(50);
});
