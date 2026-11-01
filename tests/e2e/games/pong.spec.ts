import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Pong: play a short game to its end', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/pong?deal=3');
  await page.getByTestId('pg2-length-short').click();
  await page.getByTestId('pg2-start').click();
  await expect(page.getByTestId('pg2-canvas')).toBeVisible();
  // Press and hold the up button for a moment, then let the computer win the short game.
  const up = page.getByTestId('pg2-pad-up');
  await up.dispatchEvent('pointerdown');
  await page.waitForTimeout(300);
  await up.dispatchEvent('pointerup');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'pong');
  await expect(page.getByTestId('pg2-again')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('pg2-overlay')).toContainText(/wins|win/);
});

test('Pong: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/pong?mode=watch&deal=5');
  const canvas = page.getByTestId('pg2-canvas');
  await expect(canvas).toBeVisible();
  // The computer plays both paddles: the picture keeps changing.
  const frame = () => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  const first = await frame();
  await expect.poll(frame, { timeout: 10_000 }).not.toBe(first);
});
