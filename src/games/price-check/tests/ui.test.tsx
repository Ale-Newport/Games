// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('Price Check UI', () => {
  it('plays the daily challenge with buttons, keys and typing, then records it', async () => {
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('pc-daily', {}, { timeout: 15_000 }));
    for (let round = 1; round <= 6; round++) {
      expect(screen.getByTestId('pc-round').textContent).toBe(`Item ${round} / 6`);
      expect(screen.getByTestId('pc-question').textContent).toMatch(/What did it cost in \d{4}\?/);
      const before = screen.getByTestId('pc-value').textContent;
      if (round === 1) {
        fireEvent.change(screen.getByTestId('pc-typed'), { target: { value: 'nope' } });
        fireEvent.click(screen.getByTestId('pc-lock'));
        expect(screen.getByRole('alert')).toBeTruthy();
        fireEvent.change(screen.getByTestId('pc-typed'), { target: { value: '' } });
      }
      fireEvent.click(screen.getByTestId(round % 2 ? 'pc-up' : 'pc-down'));
      expect(screen.getByTestId('pc-value').textContent).not.toBe(before);
      fireEvent.keyDown(screen.getByTestId('pc-answer'), { key: 'Enter' });
      expect(screen.getByTestId('pc-price').textContent).toMatch(/^Price: /);
      fireEvent.click(screen.getByTestId('pc-next'));
    }
    expect(screen.getByTestId('pc-final').textContent).toMatch(/^\d+ \/ 600$/);
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily' })]);
    expect(calls.achievements).toContain('first-price');
    fireEvent.click(screen.getByTestId('pc-menu-btn'));
    expect(screen.getByTestId('pc-daily-done')).toBeTruthy();
  });

  it('plays don’t-go-over by category and resumes after a reload', async () => {
    const first = createTestServices({ launchParams: { deal: '4' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('pc-rule-under', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('pc-topic-consoles'));
    fireEvent.click(screen.getByTestId('pc-endless'));
    expect(screen.getByText('Don’t go over!', { exact: false })).toBeTruthy();
    fireEvent.change(screen.getByTestId('pc-typed'), { target: { value: '1' } });
    fireEvent.click(screen.getByTestId('pc-lock'));
    expect(screen.getByTestId('pc-reveal')).toBeTruthy();
    fireEvent.click(screen.getByTestId('pc-next'));
    const name = screen.getByTestId('pc-name').textContent;
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('pc-resume', {}, { timeout: 15_000 }));
    expect(screen.getByTestId('pc-name').textContent).toBe(name);
    fireEvent.click(screen.getByTestId('pc-end'));
    await waitFor(() => expect(screen.getByTestId('pc-results')).toBeTruthy());
    expect(again.calls.results[0]).toMatchObject({ mode: 'endless:under' });
  });
});
