import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mark, pattern, type Mark } from '../../../src/games/equation-guess/engine';
import { expectNoHorizontalOverflow, freshStart, screenshot, waitForStored } from '../helpers';

const data = JSON.parse(
  readFileSync(
    new URL('../../../src/games/equation-guess/equations.json', import.meta.url),
    'utf8',
  ),
) as { six: string[]; eight: string[] };

/** Reads the marks of a played row from its tiles. */
async function rowMarks(page: Page, r: number): Promise<Mark[]> {
  const tiles = page.getByTestId(`eq-row-${r}`).locator('[role=gridcell]');
  return (await tiles.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-mark')),
  )) as Mark[];
}

/**
 * Solves the puzzle on screen like a player: every guess is a true equation that fits all the
 * colours seen so far, read back from the board.
 */
async function solve(page: Page, length: 6 | 8, useKeypad: boolean): Promise<number> {
  let cand = length === 6 ? data.six : data.eight;
  for (let r = 0; r < 6; r++) {
    const guess = cand[Math.floor(cand.length / 2)]!;
    if (useKeypad) {
      for (const ch of guess) await page.getByTestId(`eq-key-${ch}`).click();
      await page.getByTestId('eq-key-enter').click();
    } else {
      await page.keyboard.type(guess.replace(/\*/g, 'x'));
      await page.keyboard.press('Enter');
    }
    await expect(page.getByTestId(`eq-row-${r}`).locator('[data-mark=typed]')).toHaveCount(0);
    const seen = pattern(await rowMarks(page, r));
    if (seen === 'g'.repeat(length)) return r + 1;
    if (await page.getByTestId('eq-reveal').isVisible()) return 0;
    cand = cand.filter((a) => a !== guess && pattern(mark(guess, a)) === seen);
    expect(cand.length).toBeGreaterThan(0);
  }
  return 0;
}

test('Equation Guess: the daily solved from the colours, keypad and keyboard', async ({ page }) => {
  test.setTimeout(120_000);
  await freshStart(page, '/game/equation-guess');
  await page.getByTestId('eq-daily').click();
  await expect(page.getByTestId('eq-board')).toBeVisible({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);
  // An invalid guess is refused with a reason.
  await page.keyboard.type('1+2=4');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('eq-error')).toHaveText('Fill all 6 characters.');
  for (let k = 0; k < 5; k++) await page.keyboard.press('Backspace');
  const lengths = [6, 8, 8] as const;
  for (let i = 0; i < 3; i++) {
    await expect(page.getByTestId('eq-round')).toHaveText(`Equation ${i + 1} / 3`);
    const tries = await solve(page, lengths[i]!, i === 0);
    await expect(page.getByTestId('eq-reveal')).toBeVisible();
    await expect(page.getByTestId('eq-score')).toHaveText(/^\d{1,3}$/);
    if (tries) await expect(page.getByTestId('eq-reveal')).toContainText(`Solved in ${tries}!`);
    if (i === 1) {
      await expectNoHorizontalOverflow(page);
      await screenshot(page, 'equation-guess-solved');
    }
    await page.getByTestId('eq-next').click();
  }
  await expect(page.getByTestId('eq-final')).toHaveText(/^\d+ \/ 300$/);
  await expectNoHorizontalOverflow(page);
  await screenshot(page, 'equation-guess-results');
  await page.getByTestId('eq-menu-btn').click();
  await page.reload();
  await expect(page.getByTestId('eq-daily-done')).toBeVisible({ timeout: 20_000 });
});

test('Equation Guess: an endless Hard puzzle resumes after a reload', async ({ page }) => {
  test.setTimeout(60_000);
  await freshStart(page, '/game/equation-guess?deal=12');
  await page.getByTestId('eq-size-hard').click();
  await page.getByTestId('eq-endless').click();
  await expect(page.getByTestId('eq-size')).toContainText('Hard: 8 characters, 5 tries');
  const guess = data.eight[100]!;
  await page.keyboard.type(guess);
  await page.keyboard.press('Enter');
  await waitForStored(page, (v) => {
    const p = (v as { session?: { puzzles?: { guesses?: string[] }[] } })?.session?.puzzles?.at(-1);
    return p?.guesses?.length === 1;
  });
  const marks = await rowMarks(page, 0);
  await screenshot(page, 'equation-guess-hard');
  await page.reload();
  await page.getByTestId('eq-resume').click();
  expect(await rowMarks(page, 0)).toEqual(marks);
  await expect(page.getByTestId('eq-row-0')).toHaveText(
    guess.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−'),
  );
  await page.getByTestId('eq-end').click();
  await expect(page.getByTestId('eq-menu')).toBeVisible();
});
