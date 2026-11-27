// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** Lets the computer contestants take their turns (900 ms each, or 250 ms with reduced motion). */
const wait = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Closest Call UI', () => {
  it('plays a full daily game against the three computer contestants', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('cc-daily', {}, { timeout: 15_000 }));
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    for (let round = 1; round <= 8; round++) {
      expect(screen.getByTestId('cc-round').textContent).toBe(`Round ${round} / 8`);
      for (let k = 0; k < 8 && !screen.queryByTestId('cc-answer-box'); k++) await wait(300);
      expect(screen.getByTestId('cc-turn').textContent).toMatch(/your answer/);
      // Keys and buttons change the answer; Enter locks it in.
      const before = screen.getByTestId('cc-value').textContent;
      fireEvent.click(screen.getByTestId(round % 2 ? 'cc-up' : 'cc-down'));
      expect(screen.getByTestId('cc-value').textContent).not.toBe(before);
      fireEvent.keyDown(screen.getByTestId('cc-answer-box'), { key: 'Enter' });
      for (let k = 0; k < 8 && !screen.queryByTestId('cc-reveal'); k++) await wait(300);
      expect(screen.getByTestId('cc-answer').textContent).toMatch(/^The answer: /);
      for (let seat = 0; seat < 4; seat++)
        expect(screen.getByTestId(`cc-pts-${seat}`)).toBeTruthy();
      if (round < 8) fireEvent.click(screen.getByTestId('cc-next'));
    }
    expect(screen.getByTestId('cc-final')).toBeTruthy();
    expect(calls.results).toHaveLength(1);
    expect(calls.results[0]).toMatchObject({ mode: 'daily' });
    expect(['win', 'loss', 'draw']).toContain(calls.results[0]!.outcome);
    fireEvent.click(screen.getByTestId('cc-menu'));
    expect(screen.getByTestId('cc-daily-done')).toBeTruthy();
  });

  it('a custom game of two people passes the turn and resumes after a reload', async () => {
    const first = createTestServices();
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('cc-person-1', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('cc-remove-2'));
    fireEvent.change(screen.getByTestId('cc-name-1'), { target: { value: 'Rosa' } });
    fireEvent.click(screen.getByTestId('cc-start'));
    const firstTurn = screen.getByTestId('cc-turn').textContent;
    fireEvent.change(screen.getByTestId('cc-typed'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByTestId('cc-submit'));
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.change(screen.getByTestId('cc-typed'), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('cc-submit'));
    expect(screen.getByTestId('cc-turn').textContent).not.toBe(firstTurn);
    expect(screen.getByTestId('cc-turn').textContent).toMatch(/Rosa/);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('cc-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('cc-turn').textContent).toMatch(/Rosa/);
  });
});
