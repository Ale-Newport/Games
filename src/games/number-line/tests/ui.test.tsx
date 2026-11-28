// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { DATA } from '../ai-adapter';
import {
  current,
  dayNumber,
  lock,
  newDaily,
  next,
  place,
  scorePlacement,
  truePosition,
  type Session,
} from '../engine';
import { Game } from '../Game';

afterEach(cleanup);

/** The daily's expected line scores when every pin sits at the middle (0.5). */
function dailyAtMiddle(): number[] {
  let s: Session = newDaily(DATA, dayNumber());
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    const b = current(s);
    const pts = b.targets.map((_, k) => scorePlacement(0.5, truePosition(DATA, b, k)));
    out.push(Math.round(pts.reduce((a, x) => a + x, 0) / 3));
    for (let k = 0; k < 3; k++) s = place(s, k, 0.5);
    s = lock(s, DATA);
    if (i < 4) s = next(s, DATA);
  }
  return out;
}

describe('Number Line UI', () => {
  it('plays the daily by keyboard: choose, place with arrows, lock, reveal, results', async () => {
    const expected = dailyAtMiddle();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('nl-daily', {}, { timeout: 20_000 }));
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId('nl-round').textContent).toBe(`Line ${i + 1} / 5`);
      expect(screen.getByTestId('nl-value-0').textContent).toBe('not placed');
      const play = screen.getByTestId('nl-play');
      expect((screen.getByTestId('nl-lock') as HTMLButtonElement).disabled).toBe(true);
      for (const k of ['1', '2', '3']) {
        fireEvent.keyDown(play, { key: k });
        fireEvent.keyDown(play, { key: 'ArrowRight' });
      }
      expect(screen.getByTestId('nl-pin-2')).toBeTruthy();
      if (i === 0) {
        // A pin is a slider too: move one and bring it back.
        fireEvent.keyDown(screen.getByTestId('nl-pin-1'), { key: 'ArrowRight', shiftKey: true });
        expect(screen.getByTestId('nl-pin-1').getAttribute('aria-valuenow')).toBe('55');
        fireEvent.keyDown(screen.getByTestId('nl-pin-1'), { key: 'ArrowLeft', shiftKey: true });
      }
      fireEvent.keyDown(play, { key: 'Enter' });
      expect(`${i}:${screen.getByTestId('nl-score').textContent}`).toBe(`${i}:${expected[i]}`);
      expect(screen.getByTestId('nl-truth-0')).toBeTruthy();
      expect(screen.getByTestId('nl-value-0').textContent).toMatch(/yours: .* · actual: /);
      fireEvent.click(screen.getByTestId('nl-next'));
    }
    const total = expected.reduce((a, x) => a + x, 0);
    expect(screen.getByTestId('nl-final').textContent).toBe(`${total} / 500`);
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily', score: total })]);
    expect(calls.achievements).toContain('first-line');
    fireEvent.click(screen.getByTestId('nl-menu-btn'));
    expect(screen.getByTestId('nl-daily-done')).toBeTruthy();
  });

  it('chooses with buttons, resumes a board after a reload and ends the run', async () => {
    const first = createTestServices({ launchParams: { deal: '4' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('nl-topic-health', {}, { timeout: 20_000 }));
    fireEvent.click(screen.getByTestId('nl-endless'));
    fireEvent.click(screen.getByTestId('nl-target-2'));
    expect(screen.getByTestId('nl-target-2').getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(screen.getByTestId('nl-play'), { key: 'End' });
    const title = screen.getByTestId('nl-title').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('nl-resume', {}, { timeout: 20_000 }));
    expect(screen.getByTestId('nl-title').textContent).toBe(title);
    expect(screen.getByTestId('nl-pin-2').getAttribute('aria-valuenow')).toBe('100');
    fireEvent.click(screen.getByTestId('nl-end'));
    await waitFor(() => expect(screen.getByTestId('nl-menu')).toBeTruthy());
  });
});
