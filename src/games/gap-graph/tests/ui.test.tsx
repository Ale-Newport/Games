// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { DATA } from '../ai-adapter';
import { current, dayNumber, lock, newDaily, next, setGap, type Session } from '../engine';
import { Game } from '../Game';

afterEach(cleanup);

/** The daily's scores when every gap is raised one step (1 %) from the middle of the chart. */
function dailyScores(): number[] {
  let s: Session = newDaily(DATA, dayNumber());
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    const c = current(s).c;
    for (let k = 0; k < 3; k++) s = setGap(s, k, c.lo + (c.hi - c.lo) * 0.51);
    s = lock(s, DATA);
    out.push(current(s).score!);
    if (i < 4) s = next(s, DATA);
  }
  return out;
}

describe('Gap Graph UI', () => {
  it('plays the daily by keyboard: lines and bars, scores equal to the engine, results', async () => {
    const expected = dailyScores();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('gg-daily', {}, { timeout: 20_000 }));
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId('gg-round').textContent).toBe(`Chart ${i + 1} / 5`);
      expect(screen.getByTestId('gg-subtitle').textContent).toMatch(
        i % 2 ? /Eight countries in \d{4}/ : /, \d{4}–\d{4}/,
      );
      expect((screen.getByTestId('gg-lock') as HTMLButtonElement).disabled).toBe(true);
      for (let k = 0; k < 3; k++)
        fireEvent.keyDown(screen.getByTestId(`gg-handle-${k}`), { key: 'ArrowUp' });
      expect(screen.getByTestId('gg-handle-0').getAttribute('aria-valuenow')).toBe('51');
      fireEvent.keyDown(screen.getByTestId('gg-play'), { key: 'Enter' });
      expect(`${i}:${screen.getByTestId('gg-score').textContent}`).toBe(`${i}:${expected[i]}`);
      expect(screen.getByTestId('gg-row-0').textContent).toMatch(/you .* actual /);
      fireEvent.click(screen.getByTestId('gg-next'));
    }
    const total = expected.reduce((a, x) => a + x, 0);
    expect(screen.getByTestId('gg-final').textContent).toBe(`${total} / 500`);
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily', score: total })]);
    expect(calls.achievements).toContain('first-gap');
    fireEvent.click(screen.getByTestId('gg-menu-btn'));
    expect(screen.getByTestId('gg-daily-done')).toBeTruthy();
  });

  it('resumes a half-filled chart after a reload and ends the run', async () => {
    const first = createTestServices({ launchParams: { deal: '6' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('gg-topic-economy', {}, { timeout: 20_000 }));
    fireEvent.click(screen.getByTestId('gg-endless'));
    fireEvent.keyDown(screen.getByTestId('gg-handle-1'), { key: 'End' });
    const title = screen.getByTestId('gg-subtitle').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('gg-resume', {}, { timeout: 20_000 }));
    expect(screen.getByTestId('gg-subtitle').textContent).toBe(title);
    expect(screen.getByTestId('gg-handle-1').getAttribute('aria-valuenow')).toBe('100');
    fireEvent.click(screen.getByTestId('gg-end'));
    await waitFor(() => expect(screen.getByTestId('gg-menu')).toBeTruthy());
  });
});
