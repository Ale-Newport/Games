import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Snake Arena: steer with the pointer and boost', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/snake-arena?deal=3');
  await page.getByTestId('sa-bots-20').click();
  await page.getByTestId('sa-level-easy').click();
  await page.getByTestId('sa-start').click();
  const canvas = page.getByTestId('sa-canvas');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await page.waitForTimeout(800);
  await expect(page.getByTestId('sa-hud-hud.length')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'snake-arena');
  await page.getByTestId('sa-pause').click();
  await expect(page.getByTestId('sa-overlay')).toContainText(/Paused/);
});

test('Snake Arena: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/snake-arena?mode=watch&deal=5');
  const canvas = page.getByTestId('sa-canvas');
  await expect(canvas).toBeVisible();
  const frame = () => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  const first = await frame();
  await expect.poll(frame, { timeout: 10_000 }).not.toBe(first);
});
