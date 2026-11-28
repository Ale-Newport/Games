import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Tile Realm: tiles placed by clicking against masters, with wardens and zoom', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await freshStart(page, '/game/tile-realm?deal=5');
  await page.getByTestId('tr-level-master').click();
  await page.getByTestId('tr-count-2').click();
  await page.getByTestId('tr-start').click();
  await expect(page.getByTestId('tr-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  let placed = 0;
  for (let i = 0; i < 200 && placed < 6; i++) {
    const cells = page.locator('[data-testid^="tr-cell-"]');
    if (
      !(await page
        .getByTestId('tr-rot-right')
        .isVisible()
        .catch(() => false)) ||
      (await cells.count()) === 0
    ) {
      await page.waitForTimeout(250);
      continue;
    }
    await page.getByTestId('tr-rot-right').click();
    await cells.first().click();
    await expect(page.getByTestId('tr-ghost')).toBeVisible();
    const spots = page.locator('[data-testid^="tr-spot-"]');
    if (placed % 2 === 0 && (await spots.count()) > 0) {
      await spots.first().click();
      await page.getByTestId('tr-confirm').click();
    } else await page.getByTestId('tr-no-warden').click();
    placed++;
    if (placed === 3) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'tile-realm-play');
    }
  }
  expect(placed).toBe(6);
  await expect(page.getByTestId('tr-log').locator('li')).not.toHaveCount(0);
  // Zoom changes the size of the realm.
  const before = (await page.getByTestId('tr-board').boundingBox())!.width;
  await page.getByTestId('tr-zoom-in').click();
  await expect
    .poll(async () => (await page.getByTestId('tr-board').boundingBox())!.width)
    .toBeGreaterThan(before);
  await waitForStored(page, (v) => {
    const s = (v as { state?: { board?: unknown[] } | null })?.state;
    return Array.isArray(s?.board) && s.board.length >= 12;
  });
  await page.reload();
  await page.getByTestId('tr-resume').click();
  await expect(page.getByTestId('tr-board')).toBeVisible();
  await page.getByTestId('tr-to-menu').click();
  await expect(page.getByTestId('tr-menu')).toBeVisible();
});

test('Tile Realm: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/tile-realm?mode=watch&deal=3');
  await expect(page.getByTestId('tr-board')).toBeVisible();
  await expect(page.locator('[data-testid^="tr-tile-"]')).not.toHaveCount(1, { timeout: 15_000 });
  await expect(page.getByTestId('tr-log').locator('li').first()).toBeVisible();
  await screenshot(page, 'tile-realm-watch');
});
