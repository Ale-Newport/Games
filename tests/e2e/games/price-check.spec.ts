import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  sessionAt,
  waitForStored,
} from '../helpers';

test('Price Check: a full daily challenge with the slider and typing', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/price-check');
  await page.getByTestId('pc-daily').click();
  await expect(page.getByTestId('pc-name')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'price-check-start');
  for (let round = 1; round <= 6; round++) {
    await expect(page.getByTestId('pc-round')).toHaveText(`Item ${round} / 6`);
    const slider = page.getByTestId('pc-slider');
    const box = (await slider.boundingBox())!;
    await slider.click({ position: { x: box.width * (0.35 + round * 0.04), y: box.height / 2 } });
    if (round % 3 === 0) await page.getByTestId('pc-typed').fill('250');
    await page.getByTestId('pc-lock').click();
    await expect(page.getByTestId('pc-price')).toBeVisible();
    if (round === 2) await screenshot(page, 'price-check-reveal');
    await page.getByTestId('pc-next').click();
  }
  await expect(page.getByTestId('pc-final')).toHaveText(/^\d+ \/ 600$/);
  await expectNoHorizontalOverflow(page);
  await page.getByTestId('pc-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('pc-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Price Check: keyboard guesses, pictures with credits, resume', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/price-check?deal=7');
  await page.getByTestId('pc-diff-easy').click();
  await page.getByTestId('pc-endless').click();
  await expect(page.getByTestId('pc-photo')).toBeVisible();
  await page.getByTestId('pc-answer').focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('pc-credit')).toContainText('Wikimedia Commons');
  await page.getByTestId('pc-next').click();
  const name = await page.getByTestId('pc-name').textContent();
  await waitForStored(page, sessionAt(1));
  await page.reload();
  await page.getByTestId('pc-resume').click();
  await expect(page.getByTestId('pc-name')).toHaveText(name!);
  await page.getByTestId('pc-end').click();
  await expect(page.getByTestId('pc-final')).toHaveText(/^\d+ \/ 100$/);
});
