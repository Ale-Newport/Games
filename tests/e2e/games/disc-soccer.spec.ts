import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Disc Soccer: kick off and play against the bots', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/disc-soccer?deal=3');
  await page.getByTestId('ds-size-2').click();
  await page.getByTestId('ds-level-easy').click();
  await page.getByTestId('ds-start').click();
  const canvas = page.getByTestId('ds-canvas');
  await expect(canvas).toBeVisible();
  const right = page.getByTestId('ds-pad-right');
  await right.dispatchEvent('pointerdown');
  await page.waitForTimeout(600);
  await right.dispatchEvent('pointerup');
  await expect(page.getByTestId('ds-hud-hud.time')).not.toHaveText('3:00');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'disc-soccer');
  await page.getByTestId('ds-pause').click();
  await expect(page.getByTestId('ds-overlay')).toContainText(/Paused/);
});

test('Disc Soccer: watch the bots play', async ({ page }) => {
  await freshStart(page, '/game/disc-soccer?mode=watch&deal=5');
  const canvas = page.getByTestId('ds-canvas');
  await expect(canvas).toBeVisible();
  const frame = () => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  const first = await frame();
  await expect.poll(frame, { timeout: 10_000 }).not.toBe(first);
});
