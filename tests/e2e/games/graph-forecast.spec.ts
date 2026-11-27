import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  sessionAt,
  waitForStored,
} from '../helpers';

/** Draws a freehand stroke across the hidden zone, to the right edge, with real pointer moves. */
async function drawForecast(page: Page, wobble: number) {
  const svg = page.getByTestId('gf-chart').locator('svg');
  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!;
  const y0 = box.y + box.height * 0.45;
  await page.mouse.move(box.x + box.width * 0.55, y0);
  await page.mouse.down();
  const steps = 24;
  for (let i = 1; i <= steps; i++) {
    const x = box.x + box.width * (0.55 + (0.45 * i) / steps);
    await page.mouse.move(Math.min(x, box.x + box.width - 1), y0 + Math.sin(i / 3) * wobble);
  }
  await page.mouse.up();
}

test('Graph Forecast: a full daily challenge drawn with the pointer', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/graph-forecast');
  await page.getByTestId('gf-daily').click();
  await expect(page.getByTestId('gf-indicator')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'graph-forecast-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('gf-round')).toHaveText(`Graph ${round} / 5`);
    await drawForecast(page, round * 4);
    await expect(page.getByTestId('gf-chart')).toHaveAttribute('data-complete', 'true');
    if (round === 2) await screenshot(page, 'graph-forecast-drawn');
    await page.getByTestId('gf-submit').click();
    await expect(page.getByTestId('gf-reveal')).toBeVisible();
    await expect(page.getByTestId('gf-actual-line')).toBeVisible();
    await expect(page.getByTestId('gf-score')).toHaveText(/^\d{1,3}$/);
    if (round === 2) {
      await page.waitForTimeout(1500);
      await screenshot(page, 'graph-forecast-reveal');
    }
    await page.getByTestId('gf-next').click();
  }
  await expect(page.getByTestId('gf-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'graph-forecast-results');
  await page.getByTestId('gf-menu-btn').click();
  await expect(page.getByTestId('gf-daily-done')).toBeVisible();
  // The record survives a reload.
  await page.reload();
  await expect(page.getByTestId('gf-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Graph Forecast: endless run with the keyboard, resumed after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/graph-forecast?deal=9');
  await page.getByTestId('gf-diff-hard').click();
  await page.getByTestId('gf-topic-economy').click();
  await page.getByTestId('gf-endless').click();
  const chart = page.getByTestId('gf-chart');
  await chart.focus();
  await page.keyboard.press('Shift+ArrowUp');
  for (let i = 0; i < 40; i++) await page.keyboard.press('Space');
  await expect(chart).toHaveAttribute('data-complete', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('gf-reveal')).toBeVisible();
  await page.getByTestId('gf-next').click();
  const indicator = await page.getByTestId('gf-indicator').textContent();
  // The save is asynchronous (IndexedDB): wait for it before reloading.
  await waitForStored(page, sessionAt(1));
  await page.reload();
  await page.getByTestId('gf-resume').click();
  await expect(page.getByTestId('gf-indicator')).toHaveText(indicator!);
  await expect(page.getByTestId('gf-round')).toHaveText('Graph 2');
  await page.getByTestId('gf-end').click();
  await expect(page.getByTestId('gf-final')).toHaveText(/^\d+ \/ 100$/);
});
