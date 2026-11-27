// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Size Sense UI', () => {
  it('plays the daily challenge with keyboard and slider, records it, shows it in the menu', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('ss-daily', {}, { timeout: 10_000 }));
    for (let round = 1; round <= 5; round++) {
      expect(screen.getByTestId('ss-round').textContent).toBe(`Object ${round} / 5`);
      const before = Number(screen.getByTestId('ss-guess-m').textContent);
      if (round % 2) {
        const stage = screen.getByTestId('ss-stage');
        fireEvent.keyDown(stage, { key: 'ArrowUp', shiftKey: true });
        fireEvent.keyDown(stage, { key: 'ArrowUp' });
        expect(Number(screen.getByTestId('ss-guess-m').textContent)).toBeCloseTo(
          before * 1.1 * 1.02,
          6,
        );
        fireEvent.keyDown(stage, { key: 'Enter' });
      } else {
        fireEvent.change(screen.getByTestId('ss-slider'), { target: { value: '300' } });
        expect(Number(screen.getByTestId('ss-guess-m').textContent)).toBeLessThan(before);
        fireEvent.click(screen.getByTestId('ss-lock'));
      }
      const score = Number(screen.getByTestId('ss-score').textContent);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(screen.getByTestId('ss-ratio').textContent).toMatch(/×|Spot on/);
      fireEvent.click(screen.getByTestId('ss-next'));
    }
    const final = screen.getByTestId('ss-final').textContent!;
    expect(final).toMatch(/^\d+ \/ 500$/);
    expect(calls.results).toEqual([
      expect.objectContaining({
        outcome: 'complete',
        mode: 'daily',
        score: Number(final.split(' ')[0]),
      }),
    ]);
    expect(calls.achievements).toContain('first-size');
    fireEvent.click(screen.getByTestId('ss-menu-btn'));
    expect(screen.getByTestId('ss-daily-done').textContent).toBe(
      `Today: ${final.split(' ')[0]} / 500`,
    );
  });

  it('switches to imperial units and resumes an endless run after a reload', async () => {
    const first = createTestServices({ launchParams: { deal: '7' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('ss-units-imperial', {}, { timeout: 10_000 }));
    fireEvent.click(screen.getByTestId('ss-topic-space'));
    fireEvent.click(screen.getByTestId('ss-endless'));
    fireEvent.click(screen.getByTestId('ss-lock'));
    expect(screen.getByTestId('ss-reveal').textContent).toMatch(/\d (mi|ft|in)/);
    fireEvent.click(screen.getByTestId('ss-next'));
    const name = screen.getByTestId('ss-name').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('ss-resume', {}, { timeout: 10_000 }));
    expect(screen.getByTestId('ss-name').textContent).toBe(name);
    expect(screen.getByTestId('ss-round').textContent).toBe('Object 2');
    fireEvent.click(screen.getByTestId('ss-end'));
    await waitFor(() => expect(screen.getByTestId('ss-results')).toBeTruthy());
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:normal' });
  });
});
