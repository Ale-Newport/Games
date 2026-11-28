import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Star Council: pick cards, activate a system by clicking the map, move, land, play a card', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/star-council?deal=4');
  await page.getByTestId('sc-count-2').click();
  await page.getByTestId('sc-level-envoy').click();
  await page.getByTestId('sc-faction-hesh').click();
  await page.getByTestId('sc-start').click();
  await expect(page.getByTestId('sc-map')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  // We are the speaker: Command first, then whatever is left.
  await page.getByTestId('sc-pick-0').click();
  await expect(page.getByTestId('sc-prompt')).toContainText('You: pick a strategy card', {
    timeout: 15_000,
  });
  await page.locator('[data-testid^="sc-pick-"]').first().click();
  await expect(page.getByTestId('sc-prompt')).toContainText('activate a system', {
    timeout: 15_000,
  });
  // Sabble · Quill, next to our home.
  await page.getByTestId('sc-sys-24').scrollIntoViewIfNeeded();
  await page.getByTestId('sc-sys-24').click();
  await expect(page.getByTestId('sc-system')).toContainText('Sabble');
  await page.getByTestId('sc-activate').click();
  await page.getByTestId('sc-move-25-carrier').click();
  await page.getByTestId('sc-moveall-25-infantry').click();
  await screenshot(page, 'star-council-move');
  await page.getByTestId('sc-done').click();
  await page.getByTestId('sc-land-19').click();
  await page.getByTestId('sc-land-20').click();
  await page.getByTestId('sc-done').click();
  await expect(page.getByTestId('sc-log')).toContainText('Hesh Ascendancy (you) claimed Quill');
  // The computer plays; then it is our turn again.
  await expect(page.getByTestId('sc-prompt')).toContainText('You: activate a system', {
    timeout: 30_000,
  });
  await page.getByTestId('sc-play-0').click();
  await expect(page.getByTestId('sc-log')).toContainText('(you) played Command');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'star-council-turn');
  await waitForStored(page, (v) =>
    (
      (v as { state?: { ps?: { played?: number[] }[] } | null })?.state?.ps?.[0]?.played ?? []
    ).includes(0),
  );
  await page.reload();
  await page.getByTestId('sc-resume').click();
  await expect(page.getByTestId('sc-map')).toBeVisible();
  await page.getByTestId('sc-to-menu').click();
  await expect(page.getByTestId('sc-menu')).toBeVisible();
});

test('Star Council: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/star-council?mode=watch&deal=3');
  await expect(page.getByTestId('sc-map')).toBeVisible();
  await expect(page.getByTestId('sc-log')).toContainText('activated', { timeout: 30_000 });
  await screenshot(page, 'star-council-watch');
});
