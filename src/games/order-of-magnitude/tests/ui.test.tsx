// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Order of Magnitude UI', () => {
  it('plays the daily challenge with buttons, keys and typing, then records it', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('om-daily', {}, { timeout: 10_000 }));
    for (let round = 1; round <= 5; round++) {
      expect(screen.getByTestId('om-round').textContent).toBe(`Question ${round} / 5`);
      expect(screen.getByTestId('om-e').textContent).toBe('10⁶');
      // Keyboard: two powers of ten up, one figure right → 1.1 × 10⁸.
      const box = screen.getByTestId('om-answer');
      fireEvent.keyDown(box, { key: 'ArrowUp' });
      fireEvent.keyDown(box, { key: 'ArrowUp' });
      fireEvent.keyDown(box, { key: 'ArrowRight' });
      expect(screen.getByTestId('om-m').textContent).toBe('1.1');
      expect(screen.getByTestId('om-e').textContent).toBe('10⁸');
      fireEvent.keyDown(box, { key: 'Enter' });
      if (!screen.queryByTestId('om-reveal')) {
        expect(screen.getByTestId('om-guess-0').textContent).toMatch(/Higher|Lower/);
        // Typing a number sets the dials.
        fireEvent.change(screen.getByTestId('om-typed'), { target: { value: '2.5e4' } });
        fireEvent.blur(screen.getByTestId('om-typed'));
        expect(screen.getByTestId('om-m').textContent).toBe('2.5');
        expect(screen.getByTestId('om-e').textContent).toBe('10⁴');
        fireEvent.click(screen.getByTestId('om-guess'));
      }
      if (!screen.queryByTestId('om-reveal')) fireEvent.click(screen.getByTestId('om-lock'));
      expect(Number(screen.getByTestId('om-score').textContent)).toBeLessThanOrEqual(100);
      expect(screen.getByTestId('om-answer-value').textContent!.length).toBeGreaterThan(0);
      fireEvent.click(screen.getByTestId('om-next'));
    }
    const final = screen.getByTestId('om-final').textContent!;
    expect(final).toMatch(/^\d+ \/ 500$/);
    expect(calls.results).toEqual([
      expect.objectContaining({ mode: 'daily', score: Number(final.split(' ')[0]) }),
    ]);
    fireEvent.click(screen.getByTestId('om-menu-btn'));
    expect(screen.getByTestId('om-daily-done')).toBeTruthy();
  });

  it('resumes a run mid-question after a reload, then ends it', async () => {
    const first = createTestServices({ launchParams: { deal: '5' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('om-topic-space', {}, { timeout: 10_000 }));
    fireEvent.click(screen.getByTestId('om-endless'));
    const subject = screen.getByTestId('om-subject').textContent;
    fireEvent.click(screen.getByTestId('om-e-down'));
    fireEvent.click(screen.getByTestId('om-guess'));
    const guessed = screen.queryByTestId('om-guess-0')?.textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('om-resume', {}, { timeout: 10_000 }));
    expect(screen.getByTestId('om-subject').textContent).toBe(subject);
    if (guessed) expect(screen.getByTestId('om-guess-0').textContent).toBe(guessed);
    fireEvent.click(screen.getByTestId('om-end'));
    await waitFor(() =>
      expect(screen.queryByTestId('om-menu') ?? screen.queryByTestId('om-results')).toBeTruthy(),
    );
  });
});
