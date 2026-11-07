import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Mahjong solitaire: pair tiles by hint and by hand', async ({ page }) => {
  await freshStart(page, '/game/mahjong-solitaire?deal=4');
  await page.getByTestId('mj-layout-pyramid').click();
  await page.getByTestId('mj-start').click();
  await expect(page.getByTestId('mj-left')).toContainText('144');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'mahjong-solitaire');
  for (let i = 0; i < 2; i++) {
    await page.getByTestId('mj-hint').click();
    const marked = page.locator('[data-testid^="mj-tile-"][class*="hinted"]');
    await expect(marked).toHaveCount(2);
    await marked.nth(1).click();
    await marked.nth(0).click();
  }
  await expect(page.getByTestId('mj-left')).toContainText('140');
});

test('Mahjong solitaire: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/mahjong-solitaire?mode=watch&deal=3');
  await expect(page.getByTestId('mj-left')).not.toContainText('84', { timeout: 8000 });
});
