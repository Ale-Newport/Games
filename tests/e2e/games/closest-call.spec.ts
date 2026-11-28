import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Closest Call: a full daily game against three computer contestants', async ({ page }) => {
  test.setTimeout(150_000);
  await freshStart(page, '/game/closest-call');
  await page.getByTestId('cc-daily').click();
  await expect(page.getByTestId('cc-subject')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'closest-call-start');
  for (let round = 1; round <= 8; round++) {
    await expect(page.getByTestId('cc-round')).toHaveText(`Round ${round} / 8`);
    await expect(page.getByTestId('cc-answer-box')).toBeVisible({ timeout: 15_000 });
    // Drag the slider a little and type a refinement on odd rounds.
    const slider = page.getByTestId('cc-slider');
    const box = (await slider.boundingBox())!;
    await slider.click({ position: { x: box.width * (0.3 + round * 0.05), y: box.height / 2 } });
    if (round % 2) {
      // Retype the shown answer; compact figures (“US$46.34B”) don't survive that, and the game
      // rightly rejects the result — then clear the field and lock in the dial's value.
      const shown = (await page.getByTestId('cc-value').textContent())!;
      await page.getByTestId('cc-typed').fill(shown.replace(/[^\d.,]/g, '').replace(/,/g, ''));
    }
    await page.getByTestId('cc-submit').click();
    if (await page.getByRole('alert').isVisible()) {
      await page.getByTestId('cc-typed').fill('');
      await page.getByTestId('cc-submit').click();
    }
    await expect(page.getByTestId('cc-reveal')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('cc-arrow-0')).toBeVisible();
    if (round === 2) await screenshot(page, 'closest-call-reveal');
    if (round < 8) await page.getByTestId('cc-next').click();
  }
  await expect(page.getByTestId('cc-final')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'closest-call-final');
  await page.getByTestId('cc-menu').click();
  await page.reload();
  await expect(page.getByTestId('cc-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Closest Call: two people take turns on one device', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/closest-call?deal=3');
  await page.getByTestId('cc-person-1').click();
  await page.getByTestId('cc-remove-2').click();
  await page.getByTestId('cc-name-1').fill('Rosa');
  await page.getByTestId('cc-start').click();
  await expect(page.getByTestId('cc-turn')).not.toContainText('Rosa');
  await page.getByTestId('cc-answer-box').focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cc-turn')).toContainText('Rosa');
  await page.getByTestId('cc-down').click();
  await page.getByTestId('cc-submit').click();
  await expect(page.getByTestId('cc-reveal')).toBeVisible();
  await expect(page.getByTestId('cc-arrow-1')).toBeVisible();
});
