import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Gap Graph: a full daily, dragging each gap of lines and bars', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/gap-graph');
  await page.getByTestId('gg-daily').click();
  await expect(page.getByTestId('gg-chart')).toBeVisible({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'gap-graph-start');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByTestId('gg-round')).toHaveText(`Chart ${round} / 5`);
    for (let i = 0; i < 3; i++) {
      const handle = page.getByTestId(`gg-handle-${i}`);
      await handle.scrollIntoViewIfNeeded();
      const b = (await handle.boundingBox())!;
      // Drag the handle up by a different amount each time.
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      for (let k = 1; k <= 5; k++)
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 - k * (6 + i * 3));
      await page.mouse.up();
      await expect(handle).toHaveAttribute('aria-valuenow', /\d+/);
    }
    await page.getByTestId('gg-lock').click();
    await expect(page.getByTestId('gg-reveal')).toBeVisible();
    await expect(page.getByTestId('gg-score')).toHaveText(/^\d{1,3}$/);
    if (round <= 2) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, `gap-graph-reveal-${round === 1 ? 'line' : 'bars'}`);
    }
    await page.getByTestId('gg-next').click();
  }
  await expect(page.getByTestId('gg-final')).toHaveText(/^\d+ \/ 500$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'gap-graph-results');
  await page.getByTestId('gg-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('gg-daily-done')).toBeVisible({ timeout: 20_000 });
});

test('Gap Graph: keyboard gaps and resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/gap-graph?deal=9');
  await page.getByTestId('gg-topic-health').click();
  await page.getByTestId('gg-endless').click();
  await expect(page.getByTestId('gg-chart')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('gg-handle-0').focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('Shift+ArrowUp');
  await expect(page.getByTestId('gg-handle-0')).toHaveAttribute('aria-valuenow', '5');
  const title = await page.getByTestId('gg-subtitle').textContent();
  await waitForStored(page, (v) => {
    const r = (
      v as { session?: { rounds?: { guesses?: (number | null)[] }[] } }
    )?.session?.rounds?.at(-1);
    return typeof r?.guesses?.[0] === 'number';
  });
  await page.reload();
  await page.getByTestId('gg-resume').click();
  await expect(page.getByTestId('gg-subtitle')).toHaveText(title!);
  await expect(page.getByTestId('gg-handle-0')).toHaveAttribute('aria-valuenow', '5');
  await page.getByTestId('gg-end').click();
  await expect(page.getByTestId('gg-menu')).toBeVisible();
});
