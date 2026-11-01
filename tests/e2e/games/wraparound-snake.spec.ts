import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Wraparound Snake: a one-minute sprint to its end', async ({ page }) => {
  test.setTimeout(100_000);
  await freshStart(page, '/game/wraparound-snake?deal=3');
  await page.getByTestId('ws-run-sprint').click();
  await page.getByTestId('ws-start').click();
  await page.keyboard.press('ArrowUp');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'wraparound-snake');
  await expect(page.getByTestId('ws-again')).toBeVisible({ timeout: 80_000 });
  await expect(page.getByTestId('ws-overlay')).toContainText('Time!');
});

test('Wraparound Snake: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/wraparound-snake?mode=watch&deal=5');
  await expect
    .poll(async () => Number(await page.getByTestId('ws-hud-hud.length').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(3);
});
