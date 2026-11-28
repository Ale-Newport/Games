// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { BANK } from '../ai-adapter';
import {
  checkIn,
  current,
  dayNumber,
  decoys,
  newDaily,
  next,
  placeIn,
  type Session,
} from '../engine';
import { Game } from '../Game';

afterEach(cleanup);

/** The daily's boards (answers and decoys), computed the same way as the game. */
function dailyBoards() {
  let s: Session = newDaily(BANK, dayNumber());
  const out = [];
  for (let i = 0; i < 3; i++) {
    const b = current(s);
    out.push({ answer: b.answer, decoys: decoys(b) });
    s = b.answer.reduce((x, n, f) => placeIn(x, f, n), s);
    s = checkIn(s);
    if (i < 2) s = next(s, BANK);
  }
  return out;
}

describe('Fact Match UI', () => {
  it('plays the daily: clicks, keyboard, a wrong pairing crossed, then the reveal and results', async () => {
    const boards = dailyBoards();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('fm-daily', {}, { timeout: 15_000 }));
    // Board 1: a decoy on fact A first (crossed), then everything right on check 2.
    const b1 = boards[0]!;
    expect(screen.getByTestId('fm-round').textContent).toBe('Board 1 / 3');
    fireEvent.click(screen.getByTestId(`fm-number-${b1.decoys[0]}`));
    fireEvent.click(screen.getByTestId('fm-slot-0'));
    expect(screen.getByTestId(`fm-number-${b1.decoys[0]}`).textContent).toMatch(/→ A/);
    fireEvent.click(screen.getByTestId(`fm-number-${b1.answer[1]}`));
    fireEvent.click(screen.getByTestId('fm-slot-1'));
    fireEvent.click(screen.getByTestId('fm-check'));
    expect(screen.getByTestId('fm-crosses-0').textContent).toMatch(/not/);
    expect(screen.getByTestId('fm-check').textContent).toMatch(/2 left/);
    expect((screen.getByTestId(`fm-number-${b1.answer[1]}`) as HTMLButtonElement).disabled).toBe(
      true,
    );
    // Fact first, then number; and the keyboard (1–7, A–E, Enter).
    fireEvent.click(screen.getByTestId('fm-slot-0'));
    fireEvent.click(screen.getByTestId(`fm-number-${b1.answer[0]}`));
    const play = screen.getByTestId('fm-play');
    for (const f of [2, 3, 4]) {
      fireEvent.keyDown(play, { key: String(b1.answer[f]! + 1) });
      fireEvent.keyDown(play, { key: 'ABCDE'[f]!.toLowerCase() });
    }
    fireEvent.keyDown(play, { key: 'Enter' });
    expect(screen.getByTestId('fm-score').textContent).toBe('68');
    expect(screen.getByTestId('fm-decoys').children).toHaveLength(2);
    fireEvent.click(screen.getByTestId('fm-next'));
    // Boards 2 and 3: perfect.
    for (const b of boards.slice(1)) {
      b.answer.forEach((n, f) => {
        fireEvent.click(screen.getByTestId(`fm-number-${n}`));
        fireEvent.click(screen.getByTestId(`fm-slot-${f}`));
      });
      fireEvent.click(screen.getByTestId('fm-check'));
      expect(screen.getByTestId('fm-score').textContent).toBe('100');
      fireEvent.click(screen.getByTestId('fm-next'));
    }
    expect(screen.getByTestId('fm-final').textContent).toBe('268 / 300');
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily', score: 268 })]);
    expect(calls.achievements).toEqual(expect.arrayContaining(['first-board', 'perfect', 'sharp']));
    fireEvent.click(screen.getByTestId('fm-menu-btn'));
    expect(screen.getByTestId('fm-daily-done')).toBeTruthy();
  });

  it('takes a number back, resumes an endless board after a reload, and ends the run', async () => {
    const first = createTestServices({ launchParams: { deal: '7' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('fm-topic-prices', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('fm-endless'));
    expect(screen.getByTestId('fm-title').textContent).toMatch(/average price by year/);
    fireEvent.click(screen.getByTestId('fm-number-0'));
    fireEvent.click(screen.getByTestId('fm-slot-2'));
    fireEvent.click(screen.getByTestId('fm-slot-2'));
    expect(screen.getByTestId('fm-slot-2').textContent).toBe('Drop a number');
    fireEvent.click(screen.getByTestId('fm-number-4'));
    fireEvent.click(screen.getByTestId('fm-slot-1'));
    const title = screen.getByTestId('fm-title').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('fm-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('fm-title').textContent).toBe(title);
    expect(screen.getByTestId('fm-number-4').textContent).toMatch(/→ B/);
    fireEvent.click(screen.getByTestId('fm-end'));
    await waitFor(() => expect(screen.getByTestId('fm-menu')).toBeTruthy());
    expect(again.calls.results).toEqual([]);
  });
});
