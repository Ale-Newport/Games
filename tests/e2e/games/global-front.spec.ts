import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Global Front: a turn for Varn — buy, attack by clicking the map, fight, place, end', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await freshStart(page, '/game/global-front?deal=4');
  await page.getByTestId('gf-side-0').click();
  await page.getByTestId('gf-level-colonel').click();
  await page.getByTestId('gf-start').click();
  await expect(page.getByTestId('gf-map')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId('gf-buy-infantry').click();
  await page.getByTestId('gf-buy-infantry').click();
  await page.getByTestId('gf-buy-artillery').click();
  await page.getByTestId('gf-next').click();
  // Tarsk's infantry attacks Dunrow.
  await page.getByTestId('gf-loc-5').click({ force: true });
  await page.getByTestId('gf-send-infantry').click();
  await expect(page.getByTestId('gf-loc-9')).toHaveAttribute('data-target', 'true');
  await page.getByTestId('gf-loc-9').click({ force: true });
  await page.getByTestId('gf-next').click();
  await expect(page.getByTestId('gf-battle')).toBeVisible();
  await screenshot(page, 'global-front-battle');
  for (
    let k = 0;
    k < 20 &&
    (await page
      .getByTestId('gf-roll')
      .isVisible()
      .catch(() => false));
    k++
  )
    await page.getByTestId('gf-roll').click();
  await expect(page.getByTestId('gf-prompt')).toContainText('move units through friendly');
  await page.getByTestId('gf-next').click();
  // Place every bought unit on a highlighted factory.
  for (let k = 0; k < 6; k++) {
    const kinds = page.locator('[data-testid^="gf-place-"]:not([data-testid="gf-place-info"])');
    if ((await kinds.count()) === 0) break;
    await kinds.first().click();
    await page
      .locator('[data-testid^="gf-loc-"][data-target="true"]')
      .first()
      .click({ force: true });
  }
  await page.getByTestId('gf-next').click();
  // The computer plays Kelt; Ossia (ours) is next.
  await expect(page.getByTestId('gf-prompt')).toContainText('Ossian League: buy units', {
    timeout: 60_000,
  });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'global-front-turn');
  await waitForStored(
    page,
    (v) => (v as { state?: { power?: number } | null })?.state?.power === 2,
  );
  await page.reload();
  await page.getByTestId('gf-resume').click();
  await expect(page.getByTestId('gf-map')).toBeVisible();
  await page.getByTestId('gf-to-menu').click();
  await expect(page.getByTestId('gf-menu')).toBeVisible();
});

test('Global Front: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/global-front?mode=watch&deal=3');
  await expect(page.getByTestId('gf-map')).toBeVisible();
  await expect(page.getByTestId('gf-log').locator('li').first()).toBeVisible({ timeout: 30_000 });
  await screenshot(page, 'global-front-watch');
});
