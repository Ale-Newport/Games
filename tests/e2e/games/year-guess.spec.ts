import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  sessionAt,
  waitForStored,
} from '../helpers';

test('Year Guess: a full daily, tapping the timeline and nudging, with the recap', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/year-guess');
  await page.getByTestId('yg-daily').click();
  await expect(page.getByTestId('yg-subject')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'year-guess-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('yg-round')).toHaveText(`Event ${round} / 5`);
    // Tap the timeline at a different point each round, then nudge.
    const box = (await page.getByTestId('yg-slider').boundingBox())!;
    await page.mouse.click(box.x + box.width * (0.15 + round * 0.1), box.y + box.height / 2);
    const slider = page.getByTestId('yg-slider');
    const tapped = Number(await slider.getAttribute('aria-valuenow'));
    await page.getByTestId('yg-nudge-10').click();
    // There is no year 0 (from 5 BC, +10 lands on AD 6), and the timeline ends at 2025.
    const expected = Math.min(2025, tapped < 0 && tapped + 10 >= 0 ? tapped + 11 : tapped + 10);
    await expect(slider).toHaveAttribute('aria-valuenow', String(expected));
    await page.getByTestId('yg-lock').click();
    await expect(page.getByTestId('yg-answer-star')).toBeVisible();
    await expect(page.getByTestId('yg-score')).toHaveText(/^\d{1,3}$/);
    if (round === 3) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'year-guess-reveal');
    }
    await page.getByTestId('yg-next').click();
  }
  await expect(page.getByTestId('yg-final')).toHaveText(/^\d+ \/ 500$/);
  await expect(page.getByTestId('yg-recap-4')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'year-guess-results');
  await page.getByTestId('yg-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('yg-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Year Guess: keyboard and typed years, resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/year-guess?deal=12');
  await page.getByTestId('yg-era-ancient').click();
  await page.getByTestId('yg-endless').click();
  const slider = page.getByTestId('yg-slider');
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(slider).toHaveAttribute('aria-valuenow', '-3000');
  await page.keyboard.press('PageUp');
  await expect(slider).toHaveAttribute('aria-valuenow', '-2900');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('yg-answer')).toHaveText(/ BC$|^Answer: AD \d+$/);
  await page.getByTestId('yg-next').click();
  await page.getByTestId('yg-typed').fill('44 BC');
  await page.getByTestId('yg-typed').press('Enter');
  await expect(page.getByTestId('yg-reveal')).toBeVisible();
  await page.getByTestId('yg-next').click();
  const subject = await page.getByTestId('yg-subject').textContent();
  await waitForStored(page, sessionAt(2));
  await page.reload();
  await page.getByTestId('yg-resume').click();
  await expect(page.getByTestId('yg-subject')).toHaveText(subject!);
  await page.getByTestId('yg-end').click();
  await expect(page.getByTestId('yg-final')).toHaveText(/^\d+ \/ 200$/);
});
