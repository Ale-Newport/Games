// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

/** Fills every year from the keyboard (Space keeps or copies a year, then moves on), then submits. */
function drawWithKeys(raise: number) {
  const chart = screen.getByTestId('gf-chart');
  chart.focus();
  for (let i = 0; i < raise; i++) fireEvent.keyDown(chart, { key: 'ArrowUp', shiftKey: true });
  for (let i = 0; i < 45; i++) fireEvent.keyDown(chart, { key: ' ' });
  expect(chart.dataset.complete).toBe('true');
  fireEvent.keyDown(chart, { key: 'Enter' });
}

describe('Trend Draw UI', () => {
  it('plays the daily by keyboard with the world guide and the start point, then the results', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('td-daily', {}, { timeout: 20_000 }));
    for (let round = 1; round <= 5; round++) {
      expect(screen.getByTestId('td-round').textContent).toBe(`Chart ${round} / 5`);
      expect(screen.getByTestId('gf-guide')).toBeTruthy();
      expect(screen.getByTestId('gf-start')).toBeTruthy();
      expect(screen.getByTestId('td-entity').textContent).toMatch(/only \d{4} is shown/);
      if (round === 1) {
        fireEvent.click(screen.getByTestId('td-submit'));
        expect(screen.getByTestId('td-warn')).toBeTruthy();
      }
      drawWithKeys(round);
      expect(screen.getByTestId('td-score').textContent).toMatch(/^\d{1,3}$/);
      expect(screen.getByTestId('td-cpu').textContent).toMatch(
        /similar-countries curve scored \d+/,
      );
      fireEvent.click(screen.getByTestId('td-next'));
    }
    expect(screen.getByTestId('td-final').textContent).toMatch(/^\d+ \/ 500$/);
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily' })]);
    expect(calls.achievements).toContain('first-trend');
    fireEvent.click(screen.getByTestId('td-menu-btn'));
    expect(screen.getByTestId('td-daily-done')).toBeTruthy();
  });

  it('resumes an endless chart after a reload and ends the run', async () => {
    const first = createTestServices({ launchParams: { deal: '3' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('td-topic-people', {}, { timeout: 20_000 }));
    fireEvent.click(screen.getByTestId('td-endless'));
    drawWithKeys(2);
    fireEvent.click(screen.getByTestId('td-next'));
    const title =
      screen.getByTestId('td-title').textContent! + screen.getByTestId('td-entity').textContent!;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('td-resume', {}, { timeout: 20_000 }));
    expect(
      screen.getByTestId('td-title').textContent! + screen.getByTestId('td-entity').textContent!,
    ).toBe(title);
    fireEvent.click(screen.getByTestId('td-end'));
    await waitFor(() => expect(screen.getByTestId('td-results')).toBeTruthy());
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:normal' });
  });
});
