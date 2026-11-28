// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { DATA } from '../ai-adapter';
import {
  current,
  dayNumber,
  LENGTH,
  mark,
  newDaily,
  next,
  POINTS,
  submit,
  type Session,
} from '../engine';
import { Game } from '../Game';

afterEach(cleanup);

/** The daily's three answers. */
function dailyAnswers(): string[] {
  let s: Session = newDaily(DATA, dayNumber());
  const out: string[] = [];
  for (let i = 0; i < 3; i++) {
    out.push(current(s).answer);
    s = submit(s, current(s).answer);
    if (i < 2) s = next(s, DATA);
  }
  return out;
}
const wrongFor = (answer: string) =>
  (LENGTH.mini === answer.length ? DATA.six : DATA.eight).find((a) => a !== answer)!;
const typeKeys = (text: string) => {
  for (const ch of text) fireEvent.keyDown(window, { key: ch === '*' ? 'x' : ch });
};
const rowText = (r: number) => screen.getByTestId(`eq-row-${r}`).textContent;

describe('Equation Guess UI', () => {
  it('plays the daily with the keypad and the keyboard; marks and scores match the engine', async () => {
    const answers = dailyAnswers();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('eq-daily', {}, { timeout: 20_000 }));
    for (let i = 0; i < 3; i++) {
      const answer = answers[i]!;
      expect(screen.getByTestId('eq-round').textContent).toBe(`Equation ${i + 1} / 3`);
      // A false equation is refused with a reason and leaves the row as typed.
      const bad = answer.slice(0, -1) + (answer.endsWith('9') ? '8' : '9');
      typeKeys(bad);
      fireEvent.keyDown(window, { key: 'Enter' });
      expect(screen.getByTestId('eq-error').textContent).toBe('That equation is not true.');
      // Backspace clears it all.
      for (let k = 0; k < answer.length; k++) fireEvent.keyDown(window, { key: 'Backspace' });
      expect(rowText(0)).toBe('');
      // One wrong but true equation: tiles take the engine's marks; then the answer.
      const wrong = wrongFor(answer);
      if (i === 0) {
        for (const ch of wrong) fireEvent.click(screen.getByTestId(`eq-key-${ch}`));
        fireEvent.click(screen.getByTestId('eq-key-enter'));
      } else {
        typeKeys(wrong);
        fireEvent.keyDown(window, { key: 'Enter' });
      }
      const tiles = [...screen.getByTestId('eq-row-0').querySelectorAll('[role=gridcell]')];
      expect(tiles.map((el) => el.getAttribute('data-mark'))).toEqual(mark(wrong, answer));
      typeKeys(answer);
      fireEvent.keyDown(window, { key: 'Enter' });
      expect(screen.getByTestId('eq-score').textContent).toBe(String(POINTS[1]));
      expect(screen.getByTestId('eq-reveal').textContent).toContain('Solved in 2!');
      fireEvent.click(screen.getByTestId('eq-next'));
    }
    expect(screen.getByTestId('eq-final').textContent).toBe(`${3 * POINTS[1]!} / 300`);
    expect(calls.results).toEqual([
      expect.objectContaining({ mode: 'daily', score: 3 * POINTS[1]! }),
    ]);
    expect(calls.achievements).toEqual(
      expect.arrayContaining(['first-solve', 'lightning', 'hard-solve']),
    );
    fireEvent.click(screen.getByTestId('eq-menu-btn'));
    expect(screen.getByTestId('eq-daily-done')).toBeTruthy();
  });

  it('resumes an endless Mini puzzle after a reload, then loses it and ends the run', async () => {
    const first = createTestServices({ launchParams: { deal: '5' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('eq-size-mini', {}, { timeout: 20_000 }));
    fireEvent.click(screen.getByTestId('eq-endless'));
    expect(screen.getByTestId('eq-size').textContent).toMatch(/^Mini: 6 characters, 6 tries/);
    const guess = DATA.six[0]!;
    typeKeys(guess);
    fireEvent.keyDown(window, { key: 'Enter' });
    const answerShown = rowText(0);
    // Repeating a guess is refused.
    typeKeys(guess);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByTestId('eq-error').textContent).toBe('Already tried.');
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('eq-resume', {}, { timeout: 20_000 }));
    expect(rowText(0)).toBe(answerShown);
    // Five more wrong guesses lose the puzzle and show the answer.
    const answer = current((again.getSaved() as { session: Session }).session).answer;
    const wrong = DATA.six.filter((a) => a !== answer && a !== guess).slice(0, 5);
    for (const w of wrong) {
      typeKeys(w);
      act(() => {
        fireEvent.keyDown(window, { key: 'Enter' });
      });
    }
    expect(screen.getByTestId('eq-score').textContent).toBe('0');
    expect(screen.getByTestId('eq-answer').textContent).toBe(
      answer.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−'),
    );
    fireEvent.click(screen.getByTestId('eq-end'));
    await waitFor(() => expect(screen.getByTestId('eq-final').textContent).toBe('0 / 100'));
  });
});
