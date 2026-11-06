import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, freshStart, screenshot } from '../helpers';

const at = (r: number, c: number) => r * 15 + c;

async function place(page: Page, i: number, isMobile: boolean, force = false) {
  const p = page.locator(`[data-point="${i}"]`);
  if (isMobile) {
    await p.tap({ force });
    await p.tap({ force });
  } else await p.click({ force });
}

test('Renju: forbidden 3-3 point is marked and cannot be played', async ({ page, isMobile }) => {
  await freshStart(page, '/game/renju');
  await page.getByTestId('mode-local').click();
  await page.getByTestId('start-match').click();
  for (const p of [at(7, 7), at(0, 0), at(7, 8), at(0, 2), at(5, 9), at(0, 4), at(6, 9), at(0, 6)])
    await place(page, p, isMobile);
  // Forbidden points are disabled; force the attempt to prove the board rejects it.
  await place(page, at(7, 9), isMobile, true);
  await expect(page.locator(`[data-point="${at(7, 9)}"]`)).toHaveAttribute(
    'aria-label',
    'K8, forbidden for Black',
  );
  await expect(page.locator(`[data-point="${at(7, 9)}"]`)).toHaveAttribute('aria-disabled', 'true');
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'renju-forbidden');
});
