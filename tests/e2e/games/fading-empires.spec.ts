import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

/** One of our turns by clicking: pick or march, take two regions, spread the bands, end. */
async function playTurn(page: Page) {
  const prompt = page.getByTestId('fe-prompt');
  await expect(prompt).toContainText(/Pick a people|March on/, { timeout: 30_000 });
  if (
    await page
      .getByTestId('fe-pick-0')
      .isVisible()
      .catch(() => false)
  )
    await page.getByTestId('fe-pick-0').click();
  else await page.getByTestId('fe-march').click();
  for (let k = 0; k < 2; k++) {
    const offered = page.locator('[data-testid^="fe-region-"][data-target="true"]');
    if ((await offered.count()) === 0) break;
    const before = await page.getByTestId('fe-hand').textContent();
    await offered.first().click({ force: true });
    // A take spends bands; a region too dear only selects (then we stop).
    if ((await page.getByTestId('fe-hand').textContent()) === before) break;
  }
  await page.getByTestId('fe-stop').click();
  if (
    await page
      .getByTestId('fe-amount-0')
      .isVisible()
      .catch(() => false)
  ) {
    await page.getByTestId('fe-amount-0').click();
    await page
      .locator('[data-testid^="fe-region-"][data-target="true"]')
      .first()
      .click({ force: true });
  }
  await page.getByTestId('fe-done').click();
}

test('Fading Empires: turns against warlords by clicking the valley', async ({ page }) => {
  test.setTimeout(150_000);
  await freshStart(page, '/game/fading-empires?deal=6');
  await page.getByTestId('fe-level-warlord').click();
  await page.getByTestId('fe-count-3').click();
  await page.getByTestId('fe-start').click();
  await expect(page.getByTestId('fe-map')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await playTurn(page);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'fading-empires-turn');
  await playTurn(page);
  await playTurn(page);
  await expect(page.getByTestId('fe-round')).toContainText(/Round [34] of 10/);
  await expect(page.locator('[data-testid^="fe-region-"][data-owner="0"]')).not.toHaveCount(0);
  await waitForStored(page, (v) => {
    const s = (v as { state?: { round?: number } | null })?.state;
    return typeof s?.round === 'number' && s.round >= 3;
  });
  await page.reload();
  await page.getByTestId('fe-resume').click();
  await expect(page.getByTestId('fe-map')).toBeVisible();
  await page.getByTestId('fe-to-menu').click();
  await expect(page.getByTestId('fe-menu')).toBeVisible();
});

test('Fading Empires: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/fading-empires?mode=watch&deal=3');
  await expect(page.getByTestId('fe-map')).toBeVisible();
  await expect(page.locator('[data-testid^="fe-region-"][data-owner="1"]').first()).toBeAttached({
    timeout: 20_000,
  });
  await expect(page.getByTestId('fe-log').locator('li').first()).toBeVisible();
  await screenshot(page, 'fading-empires-watch');
});
