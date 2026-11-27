import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  sessionAt,
  waitForStored,
} from '../helpers';

/** Drags the mystery object's handle by `dy` pixels (vertical) or `dx` (horizontal) with real pointer moves. */
async function dragHandle(page: Page, amount: number) {
  const svg = page.getByTestId('ss-stage').locator('svg').first();
  await svg.scrollIntoViewIfNeeded();
  const axis = await svg.getAttribute('data-axis');
  const handle = (await page.getByTestId('ss-stage').locator('circle').last().boundingBox())!;
  const x = handle.x + handle.width / 2;
  const y = handle.y + handle.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    if (axis === 'horizontal') await page.mouse.move(x - (amount * i) / 10, y);
    else await page.mouse.move(x, y + (amount * i) / 10);
  }
  await page.mouse.up();
}

test('Size Sense: a full daily challenge sized with the pointer', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/size-sense');
  await page.getByTestId('ss-daily').click();
  await expect(page.getByTestId('ss-name')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'size-sense-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('ss-round')).toHaveText(`Object ${round} / 5`);
    const before = Number(await page.getByTestId('ss-guess-m').textContent());
    await dragHandle(page, 25);
    await expect
      .poll(async () => Number(await page.getByTestId('ss-guess-m').textContent()))
      .toBeLessThan(before);
    if (round === 2) await screenshot(page, 'size-sense-dragged');
    await page.getByTestId('ss-lock').click();
    await expect(page.getByTestId('ss-reveal')).toBeVisible();
    await expect(page.getByTestId('ss-actual-shape')).toBeVisible();
    await expect(page.getByTestId('ss-score')).toHaveText(/^\d{1,3}$/);
    if (round === 2) {
      await page.waitForTimeout(1000);
      await screenshot(page, 'size-sense-reveal');
    }
    await page.getByTestId('ss-next').click();
  }
  await expect(page.getByTestId('ss-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'size-sense-results');
  await page.getByTestId('ss-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('ss-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Size Sense: endless space run with the keyboard and resume', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/size-sense?deal=4');
  await page.getByTestId('ss-topic-space').click();
  await page.getByTestId('ss-endless').click();
  const stage = page.getByTestId('ss-stage');
  await stage.focus();
  const before = Number(await page.getByTestId('ss-guess-m').textContent());
  await page.keyboard.press('Shift+ArrowUp');
  await expect
    .poll(async () => Number(await page.getByTestId('ss-guess-m').textContent()))
    .toBeCloseTo(before * 1.1, 3);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('ss-reveal')).toBeVisible();
  await page.getByTestId('ss-next').click();
  const name = await page.getByTestId('ss-name').textContent();
  // The save is asynchronous (IndexedDB): wait for it before reloading.
  await waitForStored(page, sessionAt(1));
  await page.reload();
  await page.getByTestId('ss-resume').click();
  await expect(page.getByTestId('ss-name')).toHaveText(name!);
  await page.getByTestId('ss-end').click();
  await expect(page.getByTestId('ss-final')).toHaveText(/^\d+ \/ 100$/);
});
