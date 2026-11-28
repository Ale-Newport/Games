import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  sessionAt,
  waitForStored,
} from '../helpers';

/** Places every mystery country with real pointer input: a tap for most, a drag for the last. */
async function placeAll(page: Page) {
  const svg = page.getByTestId('pp-chart').locator('svg');
  const n = await page.getByRole('tab').count();
  for (let i = 0; i < n; i++) {
    await page.getByTestId(`pp-chip-${i}`).click();
    // Clicking a chip may scroll the page: measure the chart afterwards.
    await svg.scrollIntoViewIfNeeded();
    const box = (await svg.boundingBox())!;
    const x = box.x + box.width * (0.25 + 0.12 * i);
    const y = box.y + box.height * (0.7 - 0.1 * i);
    if (i < n - 1) await page.mouse.click(x, y);
    else {
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let k = 1; k <= 6; k++) await page.mouse.move(x + k * 4, y - k * 3);
      await page.mouse.up();
    }
    await expect(page.getByTestId(`pp-marker-${i}`)).toBeVisible();
  }
}

test('Plot the Point: a full daily challenge placed with the pointer', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/plot-the-point');
  await page.getByTestId('pp-daily').click();
  await expect(page.getByTestId('pp-chart')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'plot-the-point-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('pp-round')).toHaveText(`Chart ${round} / 5`);
    await placeAll(page);
    if (round === 2) await screenshot(page, 'plot-the-point-placed');
    await page.getByTestId('pp-submit').click();
    await expect(page.getByTestId('pp-reveal')).toBeVisible();
    await expect(page.getByTestId('pp-truth-0')).toBeVisible();
    if (round === 2) await screenshot(page, 'plot-the-point-reveal');
    await page.getByTestId('pp-next').click();
  }
  await expect(page.getByTestId('pp-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await page.getByTestId('pp-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('pp-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Plot the Point: keyboard placement and resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/plot-the-point?deal=5');
  await page.getByTestId('pp-diff-easy').click();
  await page.getByTestId('pp-endless').click();
  await page.getByTestId('pp-chart').focus();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Shift+ArrowRight');
    await expect(page.getByTestId(`pp-marker-${i}`)).toBeVisible();
    if (i < 2) await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('pp-reveal')).toBeVisible();
  await page.getByTestId('pp-next').click();
  const axes = await page.getByTestId('pp-y').textContent();
  await waitForStored(page, sessionAt(1));
  await page.reload();
  await page.getByTestId('pp-resume').click();
  await expect(page.getByTestId('pp-y')).toHaveText(axes!);
  await page.getByTestId('pp-end').click();
  await expect(page.getByTestId('pp-final')).toHaveText(/^\d+ \/ 100$/);
});
