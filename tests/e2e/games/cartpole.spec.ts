import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

test('Balancing Cart: pick the short pole and let it fall', async ({ page }) => {
  await freshStart(page, '/game/cartpole?deal=1');
  await page.getByTestId('bc-pole-short').click();
  await page.getByTestId('bc-start').click();
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'cartpole');
  await expect(page.getByTestId('bc-overlay')).toContainText('The pole fell', { timeout: 10_000 });
});

test('Balancing Cart: watch the AI', async ({ page }) => {
  await freshStart(page, '/game/cartpole?mode=watch&deal=2');
  await expect
    .poll(async () => Number(await page.getByTestId('bc-hud-hud.time').textContent()), {
      timeout: 20_000,
    })
    .toBeGreaterThan(8);
  await expect(page.getByTestId('bc-again')).toHaveCount(0);
});
