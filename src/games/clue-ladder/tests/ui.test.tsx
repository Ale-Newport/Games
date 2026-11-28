// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Clue Ladder UI', () => {
  it('plays the five-question daily, climbing and keeping, and shows the results', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('cl-daily', {}, { timeout: 15_000 }));
    for (let round = 1; round <= 5; round++) {
      expect(screen.getByTestId('cl-round').textContent).toBe(`Question ${round} / 5`);
      expect(screen.getByTestId('cl-rung-1').getAttribute('data-open')).toBe('false');
      // Climb `round - 1` rungs, guessing on each, then keep (or the last rung keeps itself).
      for (let rung = 0; rung < round; rung++) {
        const before = screen.getByTestId('cl-value').textContent;
        fireEvent.keyDown(screen.getByTestId('cl-answer-box'), {
          key: 'ArrowRight',
          shiftKey: rung % 2 === 1,
        });
        expect(screen.getByTestId('cl-value').textContent).not.toBe(before);
        fireEvent.click(screen.getByTestId('cl-guess'));
        if (screen.queryByTestId('cl-reveal')) break;
        expect(screen.getByTestId(`cl-fb-${rung}`).textContent).toMatch(/Higher|Lower/);
        if (rung < round - 1) {
          fireEvent.keyDown(screen.getByTestId('cl-play'), { key: 'c' });
          expect(screen.getByTestId(`cl-rung-${rung + 1}`).getAttribute('data-open')).toBe('true');
        } else fireEvent.click(screen.getByTestId('cl-keep'));
      }
      expect(screen.getByTestId('cl-answer').textContent).toMatch(/^Answer: /);
      expect(Number(screen.getByTestId('cl-score').textContent)).toBeGreaterThanOrEqual(0);
      fireEvent.click(screen.getByTestId('cl-next'));
    }
    expect(screen.getByTestId('cl-final').textContent).toMatch(/^\d+ \/ 500$/);
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily' })]);
    expect(calls.achievements).toContain('first-rung');
    fireEvent.click(screen.getByTestId('cl-menu-btn'));
    expect(screen.getByTestId('cl-daily-done')).toBeTruthy();
  });

  it('types a guess, rejects one off the scale, and resumes an endless run after a reload', async () => {
    const first = createTestServices({ launchParams: { deal: '6' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('cl-topic-distances', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('cl-endless'));
    expect(screen.getByTestId('cl-rung-0').textContent).toMatch(/straight line/);
    fireEvent.change(screen.getByTestId('cl-typed'), { target: { value: '1e12' } });
    fireEvent.click(screen.getByTestId('cl-guess'));
    expect(screen.getByRole('alert').textContent).toMatch(/on the scale/);
    fireEvent.change(screen.getByTestId('cl-typed'), { target: { value: '5000' } });
    fireEvent.keyDown(screen.getByTestId('cl-typed'), { key: 'Enter' });
    expect(screen.getByTestId('cl-fb-0').textContent).toMatch(/5,000/);
    fireEvent.click(screen.getByTestId('cl-climb'));
    const subject = screen.getByTestId('cl-subject').textContent;
    const clue = screen.getByTestId('cl-rung-1').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('cl-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('cl-subject').textContent).toBe(subject);
    expect(screen.getByTestId('cl-rung-1').textContent).toBe(clue);
    fireEvent.click(screen.getByTestId('cl-guess'));
    fireEvent.keyDown(screen.getByTestId('cl-play'), { key: 'k' });
    expect(screen.getByTestId('cl-reveal')).toBeTruthy();
    fireEvent.click(screen.getByTestId('cl-end'));
    await waitFor(() => expect(screen.getByTestId('cl-results')).toBeTruthy());
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:normal' });
  });
});
