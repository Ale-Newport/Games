import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

test('Fact Match: a full daily by taps, three checks per board when needed', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/fact-match');
  await page.getByTestId('fm-daily').click();
  await expect(page.getByTestId('fm-title')).toBeVisible({ timeout: 15_000 });
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'fact-match-start');
  for (let board = 1; board <= 3; board++) {
    await expect(page.getByTestId('fm-round')).toHaveText(`Board ${board} / 3`);
    // Each check: fill every open slot with the first numbers still free, then check.
    for (let c = 0; c < 3; c++) {
      if (await page.getByTestId('fm-reveal').isVisible()) break;
      for (let f = 0; f < 5; f++) {
        const slot = page.getByTestId(`fm-slot-${f}`);
        if (await slot.isDisabled()) continue;
        for (let n = 0; n < 7; n++) {
          const num = page.getByTestId(`fm-number-${n}`);
          if ((await num.isDisabled()) || /→/.test((await num.textContent()) ?? '')) continue;
          await num.click();
          await slot.click();
          break;
        }
      }
      await page.getByTestId('fm-check').click();
      if (board === 1 && c === 0 && !(await page.getByTestId('fm-reveal').isVisible())) {
        await expectNoHorizontalOverflow(page);
        await screenshot(page, 'fact-match-check');
      }
    }
    await expect(page.getByTestId('fm-reveal')).toBeVisible();
    await expect(page.getByTestId('fm-score')).toHaveText(/^\d{1,3}$/);
    await expect(page.getByTestId('fm-decoys').locator('li')).toHaveCount(2);
    await page.getByTestId('fm-next').click();
  }
  await expect(page.getByTestId('fm-final')).toHaveText(/^\d+ \/ 300$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'fact-match-results');
  await page.getByTestId('fm-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('fm-daily-done')).toBeVisible({ timeout: 15_000 });
});

test('Fact Match: keyboard placing and resume after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/fact-match?deal=17');
  await page.getByTestId('fm-topic-world').click();
  await page.getByTestId('fm-endless').click();
  await page.getByTestId('fm-play').focus();
  await page.keyboard.press('3');
  await page.keyboard.press('b');
  await expect(page.getByTestId('fm-number-2')).toContainText('→ B');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('fm-check')).toContainText('2');
  const title = await page.getByTestId('fm-title').textContent();
  await waitForStored(page, (v) => {
    const b = (v as { session?: { boards?: { checks?: number }[] } })?.session?.boards?.at(-1);
    return b?.checks === 1;
  });
  await page.reload();
  await page.getByTestId('fm-resume').click();
  await expect(page.getByTestId('fm-title')).toHaveText(title!);
  await expect(page.getByTestId('fm-check')).toContainText('2');
  await page.getByTestId('fm-end').click();
  await expect(page.getByTestId('fm-menu')).toBeVisible();
});
