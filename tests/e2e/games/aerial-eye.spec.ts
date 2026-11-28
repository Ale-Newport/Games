import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Aerial Eye: a full daily, zooming out on misses, with the photo credit and map', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/aerial-eye');
  await page.getByTestId('ae-daily').click();
  await expect(page.getByTestId('ae-photo')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'aerial-eye-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('ae-round')).toHaveText(`Photo ${round} / 5`);
    await expect(page.getByTestId('ae-photo')).toHaveAttribute('data-zoom', '2.2');
    // Pick options in order until the round ends (at most three picks).
    for (let i = 0; i < 6; i++) {
      if (await page.getByTestId('ae-reveal').isVisible()) break;
      const option = page.getByTestId(`ae-option-${i}`);
      if (await option.isDisabled()) continue;
      await option.click();
      if (i === 0 && round === 1 && !(await page.getByTestId('ae-reveal').isVisible())) {
        await expect(page.getByTestId('ae-photo')).toHaveAttribute('data-zoom', '1.5');
        await expect(page.getByTestId('ae-wrong')).toBeVisible();
      }
    }
    await expect(page.getByTestId('ae-reveal')).toBeVisible();
    await expect(page.getByTestId('ae-photo')).toHaveAttribute('data-zoom', '1');
    await expect(page.getByTestId('ae-credit')).toContainText('Wikimedia Commons');
    await expect(page.getByTestId('os-map')).toBeVisible();
    if (round === 1) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'aerial-eye-reveal');
    }
    await page.getByTestId('ae-next').click();
  }
  await expect(page.getByTestId('ae-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'aerial-eye-results');
  await page.getByTestId('ae-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('ae-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Aerial Eye: keyboard picks keep working after a miss, and resume after a reload', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/aerial-eye?deal=33');
  await page.getByTestId('ae-cat-castle').click();
  await page.getByTestId('ae-endless').click();
  await expect(page.getByTestId('ae-photo')).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('1');
  await expect(page.getByTestId('ae-option-0')).toBeDisabled();
  if (!(await page.getByTestId('ae-reveal').isVisible())) {
    // Focus stayed on the board: the next key still picks.
    await page.keyboard.press('2');
    await expect(page.getByTestId('ae-option-1')).toBeDisabled();
  }
  const names = await page.getByTestId(/^ae-option-/).allTextContents();
  await waitForStored(page, (v) => {
    const r = (v as { session?: { rounds?: { picks?: unknown[] }[] } })?.session?.rounds?.at(-1);
    return (r?.picks?.length ?? 0) >= 1;
  });
  await page.reload();
  await page.getByTestId('ae-resume').click();
  await expect(page.getByTestId(/^ae-option-/)).toHaveText(names);
  await page.getByTestId('ae-end').click();
});
