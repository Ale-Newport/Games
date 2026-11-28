// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { DATA } from '../ai-adapter';
import { current, dayNumber, guess, newDaily, next, type Session } from '../engine';
import { Game } from '../Game';

afterEach(cleanup);

/** The daily's targets, in order (the daily is deterministic). */
function dailyTargets(): number[] {
  let s: Session = newDaily(DATA, dayNumber());
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    out.push(current(s).target);
    s = guess(s, DATA, current(s).target);
    if (i < 4) s = next(s, DATA);
  }
  return out;
}

describe('One-Star Landmarks UI', () => {
  it('plays the daily: a miss with hint and new line, hits by keyboard and by click, a give-up', async () => {
    const targets = dailyTargets();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('os-daily', {}, { timeout: 15_000 }));
    for (let round = 0; round < 5; round++) {
      expect(screen.getByTestId('os-round').textContent).toBe(`Place ${round + 1} / 5`);
      expect(screen.getByTestId('os-line-0').textContent!.length).toBeGreaterThan(10);
      expect(screen.queryByTestId('os-line-1')).toBeNull();
      const input = screen.getByTestId('os-input');
      const target = DATA[targets[round]!]!;
      if (round === 0) {
        // A wrong guess first: pick a place that is not the answer.
        const wrong = DATA.find((r) => r !== target)!;
        fireEvent.change(input, { target: { value: wrong[1] } });
        fireEvent.click(screen.getByTestId('os-option-0'));
        expect(screen.getByTestId('os-hint-0').textContent).toMatch(/km (north|south|east|west)/);
        expect(screen.getByTestId('os-line-1')).toBeTruthy();
        expect(await screen.findByTestId('os-map', {}, { timeout: 10_000 })).toBeTruthy();
      }
      if (round === 4) fireEvent.click(screen.getByTestId('os-give-up'));
      else {
        fireEvent.change(screen.getByTestId('os-input'), { target: { value: target[1] } });
        if (round % 2) fireEvent.click(screen.getByTestId('os-option-0'));
        else fireEvent.keyDown(screen.getByTestId('os-input'), { key: 'Enter' });
      }
      expect(screen.getByTestId('os-answer').textContent).toBe(target[1]);
      expect(screen.getByTestId('os-line-2')).toBeTruthy();
      fireEvent.click(screen.getByTestId('os-next'));
    }
    expect(screen.getByTestId('os-final').textContent).toBe('375 / 500');
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily', score: 375 })]);
    expect(calls.achievements).toEqual(expect.arrayContaining(['first-find', 'first-guess']));
    fireEvent.click(screen.getByTestId('os-menu-btn'));
    expect(screen.getByTestId('os-daily-done')).toBeTruthy();
  });

  it('warns on an empty pick, resumes an endless run after a reload, and ends it', async () => {
    const first = createTestServices({ launchParams: { deal: '5' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('os-region-europe', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('os-endless'));
    const input = screen.getByTestId('os-input');
    fireEvent.change(input, { target: { value: 'qqqq' } });
    expect(screen.getByText('No place matches.')).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert').textContent).toMatch(/Choose a place/);
    fireEvent.change(input, { target: { value: 'taj' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const line = screen.getByTestId('os-line-0').textContent;
    expect(screen.getByTestId('os-hint-0').textContent).toMatch(/Taj Mahal/);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('os-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('os-line-0').textContent).toBe(line);
    expect(screen.getByTestId('os-hint-0').textContent).toMatch(/Taj Mahal/);
    fireEvent.click(screen.getByTestId('os-give-up'));
    fireEvent.click(screen.getByTestId('os-end'));
    await waitFor(() => expect(screen.getByTestId('os-results')).toBeTruthy());
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:normal', score: 0 });
  });
});
