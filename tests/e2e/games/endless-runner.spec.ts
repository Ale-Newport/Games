import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Rooftop Dash: run without jumping and fall', async ({ page }) => {
  await freshStart(page, '/game/endless-runner?deal=1');
  await page.getByTestId('rd-start').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'endless-runner');
  await expect(page.getByTestId('rd-overlay')).toContainText('Fell between', { timeout: 15_000 });
});

test('Rooftop Dash: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/endless-runner?mode=watch&deal=2');
  await expect
    .poll(
      async () => parseInt((await page.getByTestId('rd-hud-hud.dist').textContent()) ?? '0', 10),
      {
        timeout: 20_000,
      },
    )
    .toBeGreaterThan(100);
  await expect(page.getByTestId('rd-again')).toHaveCount(0);
});
