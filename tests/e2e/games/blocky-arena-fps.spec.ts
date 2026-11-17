import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Blocky Arena: start a match, move and fire', async ({ page, isMobile }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/blocky-arena-fps?deal=3');
  await page.getByTestId('fps-bots-3').click();
  await page.getByTestId('fps-level-easy').click();
  await page.getByTestId('fps-start').click();
  await expect(page.getByTestId('fps-canvas')).toBeVisible();
  if (isMobile) {
    const fire = page.getByTestId('fps-fire');
    await fire.dispatchEvent('pointerdown');
    await page.waitForTimeout(400);
    await fire.dispatchEvent('pointerup');
  } else {
    await page.getByTestId('fps-engage').click();
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyW');
    const box = (await page.getByTestId('fps-canvas').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(400);
    await page.mouse.up();
  }
  await expect
    .poll(async () => Number(await page.getByTestId('fps-ammo').textContent()))
    .toBeLessThan(30);
  await expect(page.getByTestId('fps-play')).not.toContainText('WebGL');
  await page.waitForTimeout(300);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'blocky-arena-fps');
});

test('Blocky Arena: watch the AI play', async ({ page }) => {
  await freshStart(page, '/game/blocky-arena-fps?mode=watch&deal=5');
  await expect(page.getByTestId('fps-canvas')).toBeVisible();
  const time = page.getByTestId('fps-time');
  const first = await time.textContent();
  await expect.poll(() => time.textContent(), { timeout: 10_000 }).not.toBe(first);
});
