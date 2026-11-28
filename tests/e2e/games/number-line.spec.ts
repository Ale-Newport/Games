import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Number Line: a full daily, placing by taps and drags, then the reveal', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/number-line');
  await page.getByTestId('nl-daily').click();
  await expect(page.getByTestId('nl-line')).toBeVisible({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'number-line-start');
  for (let board = 1; board <= 5; board++) {
    await expect(page.getByTestId('nl-round')).toHaveText(`Line ${board} / 5`);
    const line = page.getByTestId('nl-line');
    await line.scrollIntoViewIfNeeded();
    const box = (await line.boundingBox())!;
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`nl-target-${i}`).click();
      await page.mouse.click(box.x + box.width * (0.25 + i * 0.25), box.y + box.height * 0.5);
      await expect(page.getByTestId(`nl-pin-${i}`)).toBeVisible();
    }
    if (board === 1) {
      // Drag the middle pin a little to the right.
      const pin = (await page.getByTestId('nl-pin-1').boundingBox())!;
      const before = await page.getByTestId('nl-pin-1').getAttribute('aria-valuenow');
      await page.mouse.move(pin.x + pin.width / 2, pin.y + 4);
      await page.mouse.down();
      for (let k = 1; k <= 6; k++) await page.mouse.move(pin.x + pin.width / 2 + k * 8, pin.y + 4);
      await page.mouse.up();
      await expect(page.getByTestId('nl-pin-1')).not.toHaveAttribute('aria-valuenow', before!);
    }
    await page.getByTestId('nl-lock').click();
    await expect(page.getByTestId('nl-reveal')).toBeVisible();
    await expect(page.getByTestId('nl-truth-2')).toBeVisible();
    await expect(page.getByTestId('nl-score')).toHaveText(/^\d{1,3}$/);
    if (board === 1) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'number-line-reveal');
    }
    await page.getByTestId('nl-next').click();
  }
  await expect(page.getByTestId('nl-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'number-line-results');
  await page.getByTestId('nl-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('nl-daily-done')).toBeVisible({ timeout: 20_000 });
});

test('Number Line: keyboard placing and resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/number-line?deal=8');
  await page.getByTestId('nl-topic-economy').click();
  await page.getByTestId('nl-endless').click();
  await expect(page.getByTestId('nl-line')).toBeVisible({ timeout: 20_000 });
  await page.keyboard.press('2');
  await page.keyboard.press('End');
  await expect(page.getByTestId('nl-pin-1')).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('1');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(page.getByTestId('nl-pin-0')).toHaveAttribute('aria-valuenow', '45');
  const title = await page.getByTestId('nl-title').textContent();
  await waitForStored(page, (v) => {
    const b = (
      v as { session?: { boards?: { placed?: (number | null)[] }[] } }
    )?.session?.boards?.at(-1);
    return b?.placed?.[0] !== null && b?.placed?.[0] !== undefined;
  });
  await page.reload();
  await page.getByTestId('nl-resume').click();
  await expect(page.getByTestId('nl-title')).toHaveText(title!);
  await expect(page.getByTestId('nl-pin-1')).toHaveAttribute('aria-valuenow', '100');
  await page.getByTestId('nl-end').click();
  await expect(page.getByTestId('nl-menu')).toBeVisible();
});
