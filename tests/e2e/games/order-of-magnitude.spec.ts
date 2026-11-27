import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  sessionAt,
  waitForStored,
} from '../helpers';

test('Order of Magnitude: a full daily challenge with dials, keys and typing', async ({ page }) => {
  test.setTimeout(90_000);
  await freshStart(page, '/game/order-of-magnitude');
  await page.getByTestId('om-daily').click();
  await expect(page.getByTestId('om-subject')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'order-of-magnitude-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('om-round')).toHaveText(`Question ${round} / 5`);
    await page.getByTestId('om-e-up').click();
    await expect(page.getByTestId('om-e')).toHaveText('10⁷');
    await page.getByTestId('om-guess').click();
    if (await page.getByTestId('om-reveal').isHidden()) {
      await expect(page.getByTestId('om-guess-0')).toContainText(/Higher|Lower/);
      await page.getByTestId('om-typed').fill('4.5e5');
      await page.getByTestId('om-typed').press('Enter');
      await expect(page.getByTestId('om-e')).toHaveText('10⁵');
      await page.getByTestId('om-answer').focus();
      await page.keyboard.press('Enter');
      if (round === 2) await screenshot(page, 'order-of-magnitude-feedback');
    }
    if (await page.getByTestId('om-reveal').isHidden()) await page.getByTestId('om-lock').click();
    await expect(page.getByTestId('om-reveal')).toBeVisible();
    await expect(page.getByTestId('om-answer-marker')).toBeVisible();
    if (round === 2) await screenshot(page, 'order-of-magnitude-reveal');
    await page.getByTestId('om-next').click();
  }
  await expect(page.getByTestId('om-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'order-of-magnitude-results');
  await page.getByTestId('om-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('om-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Order of Magnitude: endless run resumed after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/order-of-magnitude?deal=3');
  await page.getByTestId('om-topic-geography').click();
  await page.getByTestId('om-endless').click();
  await page.getByTestId('om-e-down').click();
  await page.getByTestId('om-guess').click();
  if (await page.getByTestId('om-lock').isVisible()) await page.getByTestId('om-lock').click();
  await page.getByTestId('om-next').click();
  const subject = await page.getByTestId('om-subject').textContent();
  await waitForStored(page, sessionAt(1));
  await page.reload();
  await page.getByTestId('om-resume').click();
  await expect(page.getByTestId('om-subject')).toHaveText(subject!);
  await page.getByTestId('om-end').click();
  await expect(page.getByTestId('om-final')).toHaveText(/^\d+ \/ 100$/);
});
