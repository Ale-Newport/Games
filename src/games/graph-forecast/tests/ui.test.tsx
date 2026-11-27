// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

/** Fills every hidden year from the keyboard (Space keeps or copies a year, then moves on). */
function forecastWithKeys(raise: number) {
  const chart = screen.getByTestId('gf-chart');
  chart.focus();
  for (let i = 0; i < raise; i++) fireEvent.keyDown(chart, { key: 'ArrowUp', shiftKey: true });
  for (let i = 0; i < 40; i++) fireEvent.keyDown(chart, { key: ' ' });
  expect(chart.dataset.complete).toBe('true');
  fireEvent.keyDown(chart, { key: 'Enter' });
}

describe('Graph Forecast UI', () => {
  it('plays the daily challenge to the end with the keyboard, records it and resumes nothing', async () => {
    const { services, calls, getSaved } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('gf-daily', {}, { timeout: 10_000 }));
    for (let round = 1; round <= 5; round++) {
      expect(screen.getByTestId('gf-round').textContent).toBe(`Graph ${round} / 5`);
      expect(screen.getByTestId('gf-indicator').textContent!.length).toBeGreaterThan(3);
      // Submitting an incomplete line only warns.
      if (round === 1) {
        fireEvent.click(screen.getByTestId('gf-submit'));
        expect(screen.getByTestId('gf-warn')).toBeTruthy();
      }
      forecastWithKeys(round % 3);
      const score = Number(screen.getByTestId('gf-score').textContent);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(screen.getByTestId('gf-cpu').textContent).toMatch(/Computer forecaster: \d+/);
      fireEvent.click(screen.getByTestId('gf-next'));
    }
    const final = screen.getByTestId('gf-final').textContent!;
    expect(final).toMatch(/^\d+ \/ 500$/);
    expect(calls.results).toHaveLength(1);
    expect(calls.results[0]).toMatchObject({ outcome: 'complete', mode: 'daily' });
    expect(calls.results[0]!.score).toBe(Number(final.split(' ')[0]));
    expect(calls.achievements).toContain('first-forecast');
    fireEvent.click(screen.getByTestId('gf-menu-btn'));
    expect(screen.getByTestId('gf-daily-done').textContent).toBe(
      `Today: ${final.split(' ')[0]} / 500`,
    );
    expect(screen.queryByTestId('gf-resume')).toBeNull();
    const saved = getSaved() as { record: { rounds: number } };
    expect(saved.record.rounds).toBe(5);
  });

  it('resumes an endless run after a reload, then ends it', async () => {
    const first = createTestServices({ launchParams: { deal: '42' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('gf-diff-easy', {}, { timeout: 10_000 }));
    fireEvent.click(screen.getByTestId('gf-topic-health'));
    fireEvent.click(screen.getByTestId('gf-endless'));
    const indicator = screen.getByTestId('gf-indicator').textContent;
    forecastWithKeys(0);
    fireEvent.click(screen.getByTestId('gf-next'));
    const second = screen.getByTestId('gf-indicator').textContent;
    view.unmount();

    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('gf-resume', {}, { timeout: 10_000 }));
    expect(screen.getByTestId('gf-indicator').textContent).toBe(second);
    expect(screen.getByTestId('gf-round').textContent).toBe('Graph 2');
    expect(indicator).toBeTruthy();
    fireEvent.click(screen.getByTestId('gf-end'));
    await waitFor(() => expect(screen.getByTestId('gf-results')).toBeTruthy());
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:easy' });
    await act(async () => {
      fireEvent.click(screen.getByTestId('gf-menu-btn'));
    });
    expect(screen.queryByTestId('gf-resume')).toBeNull();
  });
});
