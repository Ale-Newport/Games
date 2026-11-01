import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Falling Blocks Classic: rotate, slide, and drop until the well tops out', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/falling-blocks-classic?deal=3');
  await page.getByTestId('fc-start').click();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'falling-blocks-classic');
  await page.keyboard.down('ArrowDown');
  await expect(page.getByTestId('fc-again')).toBeVisible({ timeout: 100_000 });
  await page.keyboard.up('ArrowDown');
  await expect(page.getByTestId('fc-overlay')).toContainText('Topped out');
});

test('Falling Blocks Classic: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/falling-blocks-classic?mode=watch&deal=5');
  await expect
    .poll(
      async () => Number((await page.getByTestId('fc-hud-hud.lines').textContent())!.split('/')[0]),
      { timeout: 40_000 },
    )
    .toBeGreaterThan(0);
});
