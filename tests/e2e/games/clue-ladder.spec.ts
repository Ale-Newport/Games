import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Clue Ladder: a full daily ladder, climbing for clues and keeping', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/clue-ladder');
  await page.getByTestId('cl-daily').click();
  await expect(page.getByTestId('cl-subject')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'clue-ladder-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('cl-round')).toHaveText(`Question ${round} / 5`);
    // Climb (round − 1) rungs: a slider click, then a guess on every rung.
    for (let rung = 0; rung < round; rung++) {
      const slider = page.getByTestId('cl-slider');
      await slider.scrollIntoViewIfNeeded();
      const box = (await slider.boundingBox())!;
      await slider.click({ position: { x: box.width * (0.35 + rung * 0.1), y: box.height / 2 } });
      await page.getByTestId('cl-guess').click();
      if (await page.getByTestId('cl-reveal').isVisible()) break;
      await expect(page.getByTestId(`cl-fb-${rung}`)).toBeVisible();
      if (rung < round - 1) {
        await page.getByTestId('cl-climb').click();
        await expect(page.getByTestId(`cl-rung-${rung + 1}`)).toHaveAttribute('data-open', 'true');
      } else await page.getByTestId('cl-keep').click();
    }
    await expect(page.getByTestId('cl-reveal')).toBeVisible();
    await expect(page.getByTestId('cl-score')).toHaveText(/^\d{1,3}$/);
    if (round === 4) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'clue-ladder-reveal');
    }
    await page.getByTestId('cl-next').click();
  }
  await expect(page.getByTestId('cl-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'clue-ladder-results');
  await page.getByTestId('cl-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('cl-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Clue Ladder: keyboard play and resume mid-ladder after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/clue-ladder?deal=11');
  await page.getByTestId('cl-topic-prices').click();
  await page.getByTestId('cl-endless').click();
  await page.getByTestId('cl-answer-box').focus();
  const before = await page.getByTestId('cl-value').textContent();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByTestId('cl-value')).not.toHaveText(before!);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cl-fb-0')).toBeVisible();
  await page.keyboard.press('c');
  await expect(page.getByTestId('cl-rung-1')).toHaveAttribute('data-open', 'true');
  const subject = await page.getByTestId('cl-subject').textContent();
  const clue = await page.getByTestId('cl-rung-1').textContent();
  await waitForStored(page, (v) => {
    const r = (v as { session?: { rounds?: { rung?: number }[] } })?.session?.rounds?.at(-1);
    return r?.rung === 1;
  });
  await page.reload();
  await page.getByTestId('cl-resume').click();
  await expect(page.getByTestId('cl-subject')).toHaveText(subject!);
  await expect(page.getByTestId('cl-rung-1')).toHaveText(clue!);
  await page.getByTestId('cl-guess').click();
  if (!(await page.getByTestId('cl-reveal').isVisible())) await page.keyboard.press('k');
  await expect(page.getByTestId('cl-reveal')).toBeVisible();
  await page.getByTestId('cl-end').click();
  await expect(page.getByTestId('cl-final')).toHaveText(/^\d+ \/ 100$/);
});
