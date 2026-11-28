import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('One-Star Landmarks: a full daily with wrong guesses, hints and the map', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/one-star-landmarks');
  await page.getByTestId('os-daily').click();
  await expect(page.getByTestId('os-line-0')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'one-star-start');
  // Guess from a fixed tour of famous places until each round ends (found or five misses).
  const tour = [
    'Eiffel',
    'Statue of Liberty',
    'Taj Mahal',
    'Sydney Opera',
    'Machu Picchu',
    'Great Wall',
    'Colosseum',
  ];
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('os-round')).toHaveText(`Place ${round} / 5`);
    for (const name of tour) {
      if (await page.getByTestId('os-reveal').isVisible()) break;
      const input = page.getByTestId('os-input');
      await input.fill(name);
      const option = page.getByTestId('os-option-0');
      // Already-guessed places drop out of the list; skip names with no option left.
      if (!(await option.isVisible())) continue;
      await option.click();
    }
    if (!(await page.getByTestId('os-reveal').isVisible()))
      await page.getByTestId('os-give-up').click();
    await expect(page.getByTestId('os-reveal')).toBeVisible();
    await expect(page.getByTestId('os-line-2')).toBeVisible();
    await expect(page.getByTestId('os-map')).toBeVisible();
    await expect(page.getByTestId('os-star')).toBeVisible();
    if (round === 1) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'one-star-reveal');
    }
    await page.getByTestId('os-next').click();
  }
  await expect(page.getByTestId('os-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'one-star-results');
  await page.getByTestId('os-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('os-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('One-Star Landmarks: keyboard picking, hints, resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/one-star-landmarks?deal=21');
  await page.getByTestId('os-region-asia').click();
  await page.getByTestId('os-endless').click();
  const input = page.getByTestId('os-input');
  await input.fill('bridge');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.getByTestId('os-hint-0')).toContainText('km');
  await expect(page.getByTestId('os-line-1')).toBeVisible();
  const line = await page.getByTestId('os-line-0').textContent();
  await waitForStored(page, (v) => {
    const r = (v as { session?: { rounds?: { guesses?: unknown[] }[] } })?.session?.rounds?.at(-1);
    return r?.guesses?.length === 1;
  });
  await page.reload();
  await page.getByTestId('os-resume').click();
  await expect(page.getByTestId('os-line-0')).toHaveText(line!);
  await expect(page.getByTestId('os-hint-0')).toBeVisible();
  await page.getByTestId('os-give-up').click();
  await page.getByTestId('os-end').click();
  await expect(page.getByTestId('os-final')).toHaveText('0 / 100');
});
