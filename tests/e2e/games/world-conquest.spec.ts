import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

const prompt = (page: Page) => page.getByTestId('wc-prompt');
const mineTargets = (page: Page) =>
  page.locator('[data-testid^="wc-terr-"][data-target="true"][data-owner="0"]');

/** Plays one of our turns by clicking: reinforce all on one territory, one blitz, end. */
async function playTurn(page: Page) {
  await expect(prompt(page)).toContainText(/Reinforce|trade a set/, { timeout: 60_000 });
  const trade = page.locator('[data-testid^="wc-trade-"]');
  while (await trade.count()) await trade.first().click();
  await page.getByTestId('wc-amount-0').click();
  await mineTargets(page).first().click({ force: true });
  await expect(prompt(page)).toContainText('Attack');
  // Pick a territory that can attack, then attack until it falls (or we cannot go on).
  await mineTargets(page).first().click({ force: true });
  const blitz = page.locator('[data-testid^="wc-blitz-"]');
  await expect(blitz.first()).toBeVisible();
  await blitz.first().click();
  if (await page.getByTestId('wc-advance-go').isVisible())
    await page.getByTestId('wc-advance-go').click();
  await page.getByTestId('wc-end-attack').click();
  await expect(prompt(page)).toContainText('Move armies once');
  await page.getByTestId('wc-end').click();
}

test('World Conquest: setup and two turns against marshals by clicking the map', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await freshStart(page, '/game/world-conquest?deal=5');
  await page.getByTestId('wc-level-marshal').click();
  await page.getByTestId('wc-count-3').click();
  await page.getByTestId('wc-start').click();
  await expect(page.getByTestId('wc-map')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'world-conquest-setup');
  // One placement by hand, the rest of our batches by the auto button.
  await mineTargets(page).first().click({ force: true });
  for (let i = 0; i < 60; i++) {
    if (
      await prompt(page)
        .textContent()
        .then((t) => /Reinforce|trade a set/.test(t ?? ''))
    )
      break;
    const auto = page.getByTestId('wc-auto');
    if (await auto.isVisible()) await auto.click();
    else await page.waitForTimeout(250);
  }
  await playTurn(page);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'world-conquest-turn');
  await playTurn(page);
  await expect(page.getByTestId('wc-log').locator('li')).not.toHaveCount(0);
  await waitForStored(page, (v) => {
    const s = (v as { state?: { round?: number } | null })?.state;
    return typeof s?.round === 'number' && s.round >= 1;
  });
  await page.reload();
  await page.getByTestId('wc-resume').click();
  await expect(page.getByTestId('wc-map')).toBeVisible();
  await page.getByTestId('wc-to-menu').click();
  await expect(page.getByTestId('wc-menu')).toBeVisible();
});

test('World Conquest: watch the AI play', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/world-conquest?mode=watch&deal=3');
  await expect(page.getByTestId('wc-map')).toBeVisible();
  // Battles start once the four computer players have placed their armies.
  await expect(page.getByTestId('wc-dice').locator('[data-side="a"]').first()).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByTestId('wc-log').locator('li').first()).toBeVisible();
  await screenshot(page, 'world-conquest-watch');
});
