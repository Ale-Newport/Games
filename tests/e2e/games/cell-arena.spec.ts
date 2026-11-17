import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Cell Arena: steer with the pointer', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/cell-arena?deal=3');
  await page.getByTestId('ca-bots-15').click();
  await page.getByTestId('ca-level-easy').click();
  await page.getByTestId('ca-start').click();
  const canvas = page.getByTestId('ca-canvas');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await page.waitForTimeout(800);
  await expect(page.getByTestId('ca-hud-hud.mass')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'cell-arena');
  await page.getByTestId('ca-pause').click();
  await expect(page.getByTestId('ca-overlay')).toContainText(/Paused/);
});

test('Cell Arena: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/cell-arena?mode=watch&deal=5');
  const canvas = page.getByTestId('ca-canvas');
  await expect(canvas).toBeVisible();
  const frame = () => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
  const first = await frame();
  await expect.poll(frame, { timeout: 10_000 }).not.toBe(first);
});
