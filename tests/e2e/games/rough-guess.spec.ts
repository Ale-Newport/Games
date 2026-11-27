import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  freshStart,
  screenshot,
  sessionAt,
  waitForStored,
} from '../helpers';

/** Drags a handle by dx pixels with real pointer moves. */
async function dragHandle(page: Page, part: 'lo' | 'hi', dx: number) {
  const box = (await page.getByTestId(`rg-handle-${part}`).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + (dx * i) / 8, y);
  await page.mouse.up();
}

test('Rough Guess: a full daily challenge with dragged ranges', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/rough-guess');
  await page.getByTestId('rg-daily').click();
  await expect(page.getByTestId('rg-subject')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'rough-guess-start');
  for (let round = 1; round <= 10; round++) {
    await expect(page.getByTestId('rg-round')).toHaveText(`Question ${round} / 10`);
    await page.getByTestId('rg-band').scrollIntoViewIfNeeded();
    const before = await page.getByTestId('rg-readout').textContent();
    await dragHandle(page, 'lo', -30);
    await dragHandle(page, 'hi', 30);
    await expect(page.getByTestId('rg-readout')).not.toHaveText(before!);
    await page.getByTestId('rg-lock').click();
    await expect(page.getByTestId('rg-answer-marker')).toBeVisible();
    await expect(page.getByTestId('rg-score')).toHaveText(/^\d{1,3}$/);
    if (round === 2) await screenshot(page, 'rough-guess-reveal');
    await page.getByTestId('rg-next').click();
  }
  await expect(page.getByTestId('rg-final')).toHaveText(/^\d+ \/ 1000$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'rough-guess-results');
  await page.getByTestId('rg-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('rg-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Rough Guess: keyboard handles and resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/rough-guess?deal=11');
  await page.getByTestId('rg-topic-science').click();
  await page.getByTestId('rg-endless').click();
  const before = await page.getByTestId('rg-readout').textContent();
  await page.getByTestId('rg-handle-hi').focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.getByTestId('rg-readout')).not.toHaveText(before!);
  await page.getByTestId('rg-lock').click();
  await page.getByTestId('rg-next').click();
  const subject = await page.getByTestId('rg-subject').textContent();
  await waitForStored(page, sessionAt(1));
  await page.reload();
  await page.getByTestId('rg-resume').click();
  await expect(page.getByTestId('rg-subject')).toHaveText(subject!);
  await page.getByTestId('rg-end').click();
  await expect(page.getByTestId('rg-final')).toHaveText(/^\d+ \/ 100$/);
});
