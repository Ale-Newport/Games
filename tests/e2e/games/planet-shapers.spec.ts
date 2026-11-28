import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Planet Shapers: choose a corporation, buy cards, play a card, build a settlement on the map', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/planet-shapers?deal=5');
  await page.getByTestId('ps-count-2').click();
  await page.getByTestId('ps-level-cadet').click();
  await page.getByTestId('ps-start').click();
  await expect(page.getByTestId('ps-map')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId('ps-corp-1').click();
  await page.getByTestId('ps-offer-1').click();
  await page.getByTestId('ps-offer-3').click();
  await expect(page.getByTestId('ps-buy')).toContainText('Buy 2 for 6');
  await page.getByTestId('ps-buy').click();
  await expect(page.getByTestId('ps-prompt')).toContainText('You: take an action', {
    timeout: 20_000,
  });
  await page.getByTestId('ps-play-frost-algae').click();
  await expect(page.getByTestId('ps-log')).toContainText('(you) played Frost Algae');
  await expect(page.getByTestId('ps-prompt')).toContainText('You: take an action', {
    timeout: 20_000,
  });
  await page.getByTestId('ps-std-settlement').click();
  await expect(page.getByTestId('ps-prompt')).toContainText('place a settlement');
  const spot = page.locator('[data-testid^="ps-space-"][data-target="true"]').first();
  await spot.scrollIntoViewIfNeeded();
  await spot.click();
  await expect(page.getByTestId('ps-log')).toContainText('(you) placed a settlement');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'planet-shapers-turn');
  await waitForStored(page, (v) =>
    ((v as { state?: { tiles?: unknown[] } | null })?.state?.tiles ?? []).some(Boolean),
  );
  await page.reload();
  await page.getByTestId('ps-resume').click();
  await expect(page.getByTestId('ps-map')).toBeVisible();
  await expect(page.locator('[data-tile="settlement"]')).toHaveCount(1);
  await page.getByTestId('ps-to-menu').click();
  await expect(page.getByTestId('ps-menu')).toBeVisible();
});

test('Planet Shapers: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/planet-shapers?mode=watch&deal=3');
  await expect(page.getByTestId('ps-map')).toBeVisible();
  await expect(page.getByTestId('ps-log')).toContainText('played', { timeout: 30_000 });
  await screenshot(page, 'planet-shapers-watch');
});
