// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Year Guess UI', () => {
  it('plays the five-event daily with the slider, nudges and a typed year, then shows the recap', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('yg-daily', {}, { timeout: 15_000 }));
    for (let round = 1; round <= 5; round++) {
      expect(screen.getByTestId('yg-round').textContent).toBe(`Event ${round} / 5`);
      expect(screen.getByTestId('yg-question').textContent).toMatch(/^In what year/);
      const slider = screen.getByTestId('yg-slider');
      const before = slider.getAttribute('aria-valuenow');
      fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true });
      expect(Number(slider.getAttribute('aria-valuenow'))).toBe(Number(before) + 10);
      if (round === 2) fireEvent.click(screen.getByTestId('yg-nudge--100'));
      if (round === 3) {
        fireEvent.change(screen.getByTestId('yg-typed'), { target: { value: '44 BC' } });
        expect(screen.getByTestId('yg-lock').textContent).toMatch(/44 BC/);
      }
      if (round === 4) fireEvent.keyDown(slider, { key: 'Enter' });
      else fireEvent.click(screen.getByTestId('yg-lock'));
      expect(screen.getByTestId('yg-answer').textContent).toMatch(/^Answer: (AD )?\d+( BC)?$/);
      expect(screen.getByTestId('yg-off').textContent).toMatch(/years? off|Exactly right/);
      expect(screen.getByTestId('yg-answer-star')).toBeTruthy();
      fireEvent.click(screen.getByTestId('yg-next'));
    }
    expect(screen.getByTestId('yg-final').textContent).toMatch(/^\d+ \/ 500$/);
    for (let i = 0; i < 5; i++) expect(screen.getByTestId(`yg-recap-${i}`)).toBeTruthy();
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily' })]);
    expect(calls.achievements).toContain('first-year');
    fireEvent.click(screen.getByTestId('yg-menu-btn'));
    expect(screen.getByTestId('yg-daily-done')).toBeTruthy();
  });

  it('rejects a bad typed year, and resumes an endless run after a reload', async () => {
    const first = createTestServices({ launchParams: { deal: '4' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('yg-era-c20', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('yg-topic-conflict'));
    fireEvent.click(screen.getByTestId('yg-endless'));
    fireEvent.change(screen.getByTestId('yg-typed'), { target: { value: '0' } });
    fireEvent.click(screen.getByTestId('yg-lock'));
    expect(screen.getByRole('alert').textContent).toMatch(/between 3000 BC and 2025/);
    fireEvent.change(screen.getByTestId('yg-typed'), { target: { value: '1930' } });
    fireEvent.click(screen.getByTestId('yg-lock'));
    const answer = Number(screen.getByTestId('yg-answer').textContent!.replace(/\D/g, ''));
    expect(answer).toBeGreaterThanOrEqual(1900);
    expect(answer).toBeLessThan(1960);
    fireEvent.click(screen.getByTestId('yg-next'));
    const subject = screen.getByTestId('yg-subject').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('yg-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('yg-subject').textContent).toBe(subject);
    fireEvent.click(screen.getByTestId('yg-end'));
    await waitFor(() => expect(screen.getByTestId('yg-results')).toBeTruthy());
    expect(screen.getByTestId('yg-final').textContent).toBe(
      `${again.calls.results[0]!.score} / 100`,
    );
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:normal' });
  });
});
