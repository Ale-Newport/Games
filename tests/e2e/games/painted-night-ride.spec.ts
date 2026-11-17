import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Painted Night Ride: pedal into the painted night', async ({ page, isMobile }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/painted-night-ride?deal=3');
  await page.getByTestId('nr-start').click();
  await expect(page.getByTestId('nr-canvas')).toBeVisible();
  if (isMobile) {
    const pedal = page.getByTestId('nr-pad-pedal');
    await pedal.dispatchEvent('pointerdown');
    await page.waitForTimeout(1200);
    await pedal.dispatchEvent('pointerup');
  } else {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    await page.keyboard.up('KeyW');
  }
  await expect(page.getByTestId('nr-play')).not.toContainText('WebGL');
  await expect(page.getByTestId('nr-time')).not.toHaveText('0:00');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'painted-night-ride');
});

test('Painted Night Ride: watch the AI deliver stars', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/painted-night-ride?mode=watch&deal=3');
  await expect(page.getByTestId('nr-carried')).toBeVisible();
  await expect(page.getByTestId('nr-carried')).not.toHaveText(/Carrying 0/, { timeout: 30_000 });
});
