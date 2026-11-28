import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Iron Fields: choose Move, walk the character by clicking the map, then produce, resume', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/iron-fields?deal=4');
  await page.getByTestId('if-count-2').click();
  await page.getByTestId('if-level-recruit').click();
  await page.getByTestId('if-faction-thorn').click();
  await page.getByTestId('if-start').click();
  await expect(page.getByTestId('if-map')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId('if-section-0').click();
  await page.getByTestId('if-space-25').scrollIntoViewIfNeeded();
  await page.getByTestId('if-space-25').click();
  await expect(page.getByTestId('if-unit-0')).toHaveAttribute('aria-pressed', 'true');
  const target = page.locator('[data-testid^="if-space-"][data-target="true"]').first();
  await target.scrollIntoViewIfNeeded();
  await target.click();
  await expect(page.getByTestId('if-log')).toContainText('Thornwood (you) moved a character');
  await page.getByTestId('if-done').click();
  if (
    await page
      .getByTestId('if-done')
      .isVisible()
      .catch(() => false)
  ) {
    await page.getByTestId('if-done').click();
  }
  // The recruit plays; then our turn again: produce.
  await expect(page.getByTestId('if-prompt')).toContainText('You: choose a section', {
    timeout: 20_000,
  });
  await page.getByTestId('if-section-2').click();
  const spot = page.locator('[data-testid^="if-space-"][data-target="true"]').first();
  await spot.scrollIntoViewIfNeeded();
  await spot.click();
  await expect(page.getByTestId('if-log')).toContainText('(you) produced');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'iron-fields-turn');
  await waitForStored(page, (v) =>
    ((v as { state?: { log?: { k: string }[] } | null })?.state?.log ?? []).some(
      (e) => e.k === 'produce',
    ),
  );
  await page.reload();
  await page.getByTestId('if-resume').click();
  await expect(page.getByTestId('if-map')).toBeVisible();
  await page.getByTestId('if-to-menu').click();
  await expect(page.getByTestId('if-menu')).toBeVisible();
});

test('Iron Fields: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/iron-fields?mode=watch&deal=3');
  await expect(page.getByTestId('if-map')).toBeVisible();
  await expect(page.getByTestId('if-log')).toContainText('chose', { timeout: 30_000 });
  await screenshot(page, 'iron-fields-watch');
});
