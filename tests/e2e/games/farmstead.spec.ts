import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Farmstead: take goods, plough a field on the farm, reach round 2, resume', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/farmstead?deal=4');
  await page.getByTestId('fs-count-2').click();
  await page.getByTestId('fs-level-farmhand').click();
  await page.getByTestId('fs-start').click();
  await expect(page.getByTestId('fs-board')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByTestId('fs-space-forest').click();
  await expect(page.getByTestId('fs-log')).toContainText('(you) took Forest (3 Timber)');
  await expect(page.getByTestId('fs-prompt')).toContainText('You: place a family member', {
    timeout: 20_000,
  });
  await page.getByTestId('fs-space-plough').click();
  await expect(page.getByTestId('fs-prompt')).toContainText('Plough a field');
  await page.getByTestId('fs-cell-0').click();
  await expect(page.getByTestId('fs-cell-0')).toHaveAttribute('data-kind', 'field');
  await expect(page.getByTestId('fs-round')).toContainText('Round 2 of 12', { timeout: 20_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'farmstead-turn');
  await waitForStored(
    page,
    (v) => (v as { state?: { round?: number } | null })?.state?.round === 2,
  );
  await page.reload();
  await page.getByTestId('fs-resume').click();
  await expect(page.getByTestId('fs-cell-0')).toHaveAttribute('data-kind', 'field');
  await page.getByTestId('fs-to-menu').click();
  await expect(page.getByTestId('fs-menu')).toBeVisible();
});

test('Farmstead: watch the AI play', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/farmstead?mode=watch&deal=3');
  await expect(page.getByTestId('fs-board')).toBeVisible();
  await expect(page.getByTestId('fs-log')).toContainText('took', { timeout: 30_000 });
  await screenshot(page, 'farmstead-watch');
});
