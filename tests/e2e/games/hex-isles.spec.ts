import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

/** Handles whatever the table asks of the human seat; returns what it did. */
async function step(page: Page): Promise<string> {
  const visible = async (sel: string) =>
    (await page.locator(sel).count()) > 0 && (await page.locator(sel).first().isVisible());
  if (await visible('[data-testid^="hi-corner-"]')) {
    await page.locator('[data-testid^="hi-corner-"]').first().click();
    return 'corner';
  }
  if (await visible('[data-testid^="hi-edge-"]')) {
    await page.locator('[data-testid^="hi-edge-"]').first().click();
    return 'edge';
  }
  if (await visible('[data-testid^="hi-hex-"]')) {
    await page.locator('[data-testid^="hi-hex-"]').first().click();
    return 'storm';
  }
  if (await visible('[data-testid^="hi-steal-"]')) {
    await page.locator('[data-testid^="hi-steal-"]').first().click();
    return 'steal';
  }
  if (await visible('[data-testid="hi-discard"]')) {
    for (let r = 0; r < 5 && (await page.getByTestId('hi-discard-go').isDisabled()); r++)
      for (let k = 0; k < 10; k++) await page.getByTestId(`hi-dis-plus-${r}`).click();
    await page.getByTestId('hi-discard-go').click();
    return 'discard';
  }
  if (await visible('[data-testid="hi-decline"]')) {
    await page.getByTestId('hi-decline').click();
    return 'decline';
  }
  if (await visible('[data-testid="hi-roll"]')) {
    await page.getByTestId('hi-roll').click();
    return 'roll';
  }
  if (await visible('[data-testid="hi-end"]')) {
    // Build a path when affordable (placing it on the island), then end the turn.
    if (await page.getByTestId('hi-build-path').isEnabled()) {
      await page.getByTestId('hi-build-path').click();
      await page.locator('[data-testid^="hi-edge-"]').first().click();
      return 'path';
    }
    await page.getByTestId('hi-end').click();
    return 'end';
  }
  await page.waitForTimeout(250);
  return 'wait';
}

test('Hex Isles: setup and turns against strategists by clicking the island', async ({ page }) => {
  test.setTimeout(150_000);
  await freshStart(page, '/game/hex-isles?deal=7');
  await page.getByTestId('hi-level-strategist').click();
  await page.getByTestId('hi-count-4').click();
  await page.getByTestId('hi-start').click();
  await expect(page.getByTestId('hi-board')).toBeVisible();
  await expect(page.locator('[data-testid^="hi-corner-"]').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'hex-isles-setup');
  const done: string[] = [];
  let ends = 0;
  for (let i = 0; i < 400 && ends < 3; i++) {
    const did = await step(page);
    if (did !== 'wait') done.push(did);
    if (did === 'end') ends++;
    if (ends === 1 && did === 'end') {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'hex-isles-turn');
    }
  }
  expect(done.filter((d) => d === 'corner')).toHaveLength(2);
  expect(done.filter((d) => d === 'roll').length).toBeGreaterThanOrEqual(3);
  expect(ends).toBe(3);
  // Two huts of ours on the island, a log of the turns, the four players listed.
  await expect(page.locator('[data-testid^="hi-site-"]')).not.toHaveCount(0);
  await expect(page.getByTestId('hi-log').locator('li')).not.toHaveCount(0);
  await expect(page.getByTestId('hi-players').locator('li')).toHaveCount(4);
  // Saved and resumable.
  await waitForStored(page, (v) => {
    const s = (v as { state?: { round?: number } | null })?.state;
    return typeof s?.round === 'number' && s.round >= 2;
  });
  await page.reload();
  await page.getByTestId('hi-resume').click();
  await expect(page.getByTestId('hi-board')).toBeVisible();
  await page.getByTestId('hi-to-menu').click();
  await expect(page.getByTestId('hi-menu')).toBeVisible();
});

test('Hex Isles: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/hex-isles?mode=watch&deal=3');
  await expect(page.getByTestId('hi-board')).toBeVisible();
  // Eight setup placements by four computer players, then dice.
  await expect(page.locator('[data-testid^="hi-site-"]')).toHaveCount(8, { timeout: 30_000 });
  await expect(page.getByTestId('hi-dice').locator('b')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('hi-log').locator('li').first()).toBeVisible();
  await screenshot(page, 'hex-isles-watch');
});
