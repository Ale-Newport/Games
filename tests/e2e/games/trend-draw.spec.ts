import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

/** Draws a wavy freehand line across the whole plot with real pointer moves. */
async function draw(page: Page, lift: number) {
  const chart = page.getByTestId('gf-chart');
  await chart.scrollIntoViewIfNeeded();
  const box = (await chart.locator('svg').boundingBox())!;
  const y = (k: number) =>
    box.y + box.height * (0.55 - lift * 0.05 - 0.2 * k + 0.05 * Math.sin(k * 9));
  await page.mouse.move(box.x + box.width * 0.12, y(0));
  await page.mouse.down();
  for (let i = 1; i <= 24; i++)
    await page.mouse.move(box.x + box.width * (0.12 + (0.87 * i) / 24), y(i / 24));
  await page.mouse.up();
}

test('Trend Draw: a full daily drawn freehand, with the world guide and the reveal', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/trend-draw');
  await page.getByTestId('td-daily').click();
  await expect(page.getByTestId('gf-chart')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('gf-guide')).toBeVisible();
  await expect(page.getByTestId('gf-start')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'trend-draw-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('td-round')).toHaveText(`Chart ${round} / 5`);
    await draw(page, round % 3);
    await expect(page.getByTestId('gf-chart')).toHaveAttribute('data-complete', 'true');
    await page.getByTestId('td-submit').click();
    await expect(page.getByTestId('td-reveal')).toBeVisible();
    await expect(page.getByTestId('td-score')).toHaveText(/^\d{1,3}$/);
    if (round === 1) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'trend-draw-reveal');
    }
    await page.getByTestId('td-next').click();
  }
  await expect(page.getByTestId('td-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'trend-draw-results');
  await page.getByTestId('td-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('td-daily-done')).toBeVisible({ timeout: 20_000 });
});

test('Trend Draw: clear, keyboard drawing and resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/trend-draw?deal=5');
  await page.getByTestId('td-topic-health').click();
  await page.getByTestId('td-endless').click();
  await expect(page.getByTestId('gf-chart')).toBeVisible({ timeout: 20_000 });
  await draw(page, 1);
  await page.getByTestId('td-clear').click();
  await expect(page.getByTestId('gf-chart')).toHaveAttribute('data-complete', 'false');
  await page.getByTestId('gf-chart').focus();
  await page.keyboard.press('Shift+ArrowUp');
  for (let i = 0; i < 45; i++) await page.keyboard.press(' ');
  await expect(page.getByTestId('gf-chart')).toHaveAttribute('data-complete', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('td-reveal')).toBeVisible();
  await page.getByTestId('td-next').click();
  const title = await page.getByTestId('td-entity').textContent();
  await waitForStored(page, (v) => {
    const s = (v as { session?: { count?: number; rounds?: { pred?: unknown }[] } })?.session;
    return s?.count === 1 && s.rounds?.at(-1)?.pred === null;
  });
  await page.reload();
  await page.getByTestId('td-resume').click();
  await expect(page.getByTestId('td-entity')).toHaveText(title!);
  await page.getByTestId('td-end').click();
  await expect(page.getByTestId('td-final')).toHaveText(/^\d+ \/ 100$/);
});
