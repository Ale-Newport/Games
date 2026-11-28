// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

/** Places every mystery country with the keyboard: select its chip, nudge it from the centre. */
function placeAll(n: number) {
  const chart = screen.getByTestId('pp-chart');
  for (let i = 0; i < n; i++) {
    fireEvent.click(screen.getByTestId(`pp-chip-${i}`));
    fireEvent.keyDown(chart, { key: i % 2 ? 'ArrowUp' : 'ArrowRight', shiftKey: true });
    expect(screen.getByTestId(`pp-marker-${i}`)).toBeTruthy();
  }
}

describe('Plot the Point UI', () => {
  it('plays the daily challenge with the keyboard and records it', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('pp-daily', {}, { timeout: 15_000 }));
    for (let round = 1; round <= 5; round++) {
      expect(screen.getByTestId('pp-round').textContent).toBe(`Chart ${round} / 5`);
      const n = screen.getAllByRole('tab').length;
      expect(n).toBe(4);
      if (round === 1) {
        fireEvent.click(screen.getByTestId('pp-submit'));
        expect(screen.getByTestId('pp-warn')).toBeTruthy();
      }
      placeAll(n);
      fireEvent.keyDown(screen.getByTestId('pp-chart'), { key: 'Enter' });
      expect(Number(screen.getByTestId('pp-score').textContent)).toBeGreaterThanOrEqual(0);
      expect(screen.getByTestId('pp-cpu').textContent).toMatch(
        /Computer \(similar countries\): \d+/,
      );
      for (let i = 0; i < n; i++) expect(screen.getByTestId(`pp-truth-${i}`)).toBeTruthy();
      fireEvent.click(screen.getByTestId('pp-next'));
    }
    expect(screen.getByTestId('pp-final').textContent).toMatch(/^\d+ \/ 500$/);
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily' })]);
    expect(calls.achievements).toContain('first-chart');
    fireEvent.click(screen.getByTestId('pp-menu-btn'));
    expect(screen.getByTestId('pp-daily-done')).toBeTruthy();
  });

  it('resumes an endless run after a reload and ends it', async () => {
    const first = createTestServices({ launchParams: { deal: '8' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('pp-diff-hard', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('pp-endless'));
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    placeAll(5);
    fireEvent.click(screen.getByTestId('pp-submit'));
    fireEvent.click(screen.getByTestId('pp-next'));
    const axes = screen.getByTestId('pp-y').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('pp-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('pp-y').textContent).toBe(axes);
    expect(screen.getByTestId('pp-round').textContent).toBe('Chart 2');
    fireEvent.click(screen.getByTestId('pp-end'));
    await waitFor(() => expect(screen.getByTestId('pp-results')).toBeTruthy());
  });
});
