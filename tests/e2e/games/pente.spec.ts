import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const at = (r: number, c: number) => r * 19 + c;

async function place(page: Page, i: number, isMobile: boolean) {
  const p = page.locator(`[data-point="${i}"]`);
  if (isMobile) {
    await p.tap();
    await p.tap();
  } else await p.click();
}

test('Pente: a capture removes the pair and updates the counter', async ({ page, isMobile }) => {
  await freshStart(page, '/game/pente');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const p of [at(9, 9), at(9, 10), at(3, 3), at(5, 6), at(5, 5), at(5, 7), at(5, 8)])
    await place(page, p, isMobile);
  await expect(page.getByTestId('status-info')).toContainText('Black 1 · White 0');
  await expect(page.locator(`[data-point="${at(5, 6)}"]`)).toHaveAttribute('aria-label', /empty/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'pente-capture');
});

test('Pente vs Hard: the CPU replies within its budget', async ({ page, isMobile }) => {
  await freshStart(page, '/game/pente');
  await page.getByTestId('difficulty-hard').click();
  await page.getByTestId('start-match').click();
  await place(page, at(9, 9), isMobile);
  await expect(page.getByTestId('mnk-status')).toContainText('Your turn', { timeout: 8000 });
  expect(await page.locator('[data-point][aria-label$="white stone"]').count()).toBe(1);
});
