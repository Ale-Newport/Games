// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Rough Guess UI', () => {
  it('plays the ten-question daily with the keyboard handles and shows the calibration', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('rg-daily', {}, { timeout: 15_000 }));
    for (let round = 1; round <= 10; round++) {
      expect(screen.getByTestId('rg-round').textContent).toBe(`Question ${round} / 10`);
      const before = screen.getByTestId('rg-readout').textContent;
      // Widen the range: lower bound to the start, upper bound to the end of the scale.
      fireEvent.keyDown(screen.getByTestId('rg-handle-lo'), { key: 'Home' });
      fireEvent.keyDown(screen.getByTestId('rg-handle-hi'), { key: 'End' });
      if (round % 2)
        fireEvent.keyDown(screen.getByTestId('rg-handle-hi'), { key: 'ArrowLeft', shiftKey: true });
      expect(screen.getByTestId('rg-readout').textContent).not.toBe(before);
      fireEvent.click(screen.getByTestId('rg-lock'));
      expect(screen.getByTestId('rg-answer').textContent).toMatch(/^Answer: /);
      expect(Number(screen.getByTestId('rg-score').textContent)).toBeGreaterThanOrEqual(0);
      fireEvent.click(screen.getByTestId('rg-next'));
    }
    expect(screen.getByTestId('rg-final').textContent).toMatch(/^\d+ \/ 1000$/);
    expect(screen.getByTestId('rg-calibration').textContent).toMatch(
      /of 10 ranges contained the answer/,
    );
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily' })]);
    expect(calls.achievements).toContain('first-range');
    fireEvent.click(screen.getByTestId('rg-menu-btn'));
    expect(screen.getByTestId('rg-daily-done')).toBeTruthy();
  });

  it('resumes an endless run after a reload and ends it', async () => {
    const first = createTestServices({ launchParams: { deal: '6' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('rg-topic-prices', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('rg-endless'));
    expect(screen.getByTestId('rg-question').textContent).toMatch(/average price in \d{4}/);
    fireEvent.click(screen.getByTestId('rg-lock'));
    fireEvent.click(screen.getByTestId('rg-next'));
    const subject = screen.getByTestId('rg-subject').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('rg-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('rg-subject').textContent).toBe(subject);
    fireEvent.click(screen.getByTestId('rg-end'));
    await waitFor(() => expect(screen.getByTestId('rg-results')).toBeTruthy());
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:normal' });
  });
});
