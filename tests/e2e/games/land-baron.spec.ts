import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

/** Answers whatever the table asks of us: roll, buy (or bid once), pay debts, end the turn. */
async function step(page: Page): Promise<string> {
  const ready = async (id: string) => {
    const b = page.getByTestId(id);
    return (await b.count()) > 0 && (await b.isVisible()) && (await b.isEnabled());
  };
  for (const id of ['lb-roll', 'lb-buy', 'lb-pass', 'lb-refuse', 'lb-end']) {
    if (await ready(id)) {
      await page.getByTestId(id).click();
      return id;
    }
  }
  if (await ready('lb-decline')) {
    await page.getByTestId('lb-decline').click();
    return 'lb-decline';
  }
  const raise = page.getByTestId('lb-raise').locator('button');
  if ((await raise.count()) > 0) {
    await raise.first().click();
    return 'raise';
  }
  await page.waitForTimeout(250);
  return 'wait';
}

test('Land Baron: turns against barons — rolls, purchases, details and resume', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await freshStart(page, '/game/land-baron?deal=8');
  await page.getByTestId('lb-level-baron').click();
  await page.getByTestId('lb-count-3').click();
  await page.getByTestId('lb-length-30').click();
  await page.getByTestId('lb-start').click();
  await expect(page.getByTestId('lb-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const done: string[] = [];
  for (let i = 0; i < 400 && done.filter((d) => d === 'lb-end').length < 4; i++) {
    const d = await step(page);
    if (d !== 'wait') done.push(d);
  }
  expect(done.filter((d) => d === 'lb-roll').length).toBeGreaterThanOrEqual(4);
  expect(done.filter((d) => d === 'lb-end')).toHaveLength(4);
  await expect(page.getByTestId('lb-log').locator('li')).not.toHaveCount(0);
  // Click a space for its details.
  await page.getByTestId('lb-space-35').click();
  await expect(page.getByTestId('lb-info')).toContainText('Crown Parade');
  await expect(page.getByTestId('lb-info')).toContainText('Price 400');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'land-baron-turn');
  await waitForStored(page, (v) => {
    const s = (v as { state?: { round?: number } | null })?.state;
    return typeof s?.round === 'number' && s.round >= 2;
  });
  await page.reload();
  await page.getByTestId('lb-resume').click();
  await expect(page.getByTestId('lb-board')).toBeVisible();
  await page.getByTestId('lb-to-menu').click();
  await expect(page.getByTestId('lb-menu')).toBeVisible();
});

test('Land Baron: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/land-baron?mode=watch&deal=3');
  await expect(page.getByTestId('lb-board')).toBeVisible();
  await expect(page.getByTestId('lb-dice').locator('span').first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId('lb-log').locator('li')).not.toHaveCount(0);
  await expect(page.locator('[data-testid^="lb-space-"][data-owned="true"]').first()).toBeVisible({
    timeout: 30_000,
  });
  await screenshot(page, 'land-baron-watch');
});
