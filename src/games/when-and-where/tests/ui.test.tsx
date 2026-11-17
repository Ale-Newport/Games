// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(cleanup);

describe('When & Where UI', () => {
  it('pins, picks a year, reveals and totals five rounds', async () => {
    const { services, calls } = createTestServices({ launchParams: { deal: '6' } });
    render(<Game services={services} />);
    fireEvent.click(screen.getByTestId('ww-timer-0'));
    fireEvent.click(screen.getByTestId('ww-start'));
    for (let round = 0; round < 5; round++) {
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      const map = screen.getByTestId('ww-map');
      map.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 960,
        height: 500,
        right: 960,
        bottom: 500,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      expect((screen.getByTestId('ww-guess') as HTMLButtonElement).disabled).toBe(true);
      fireEvent.pointerDown(map, { clientX: 480, clientY: 200, pointerId: 1 });
      fireEvent.pointerUp(map, { clientX: 480, clientY: 200, pointerId: 1 });
      expect(screen.getByTestId('ww-pin')).toBeTruthy();
      fireEvent.change(screen.getByTestId('ww-year-range'), { target: { value: '1960' } });
      expect(screen.getByTestId('ww-year').textContent).toBe('1960');
      fireEvent.click(screen.getByTestId('ww-guess'));
      expect(screen.getByTestId('ww-reveal').textContent).toMatch(/km away/);
      expect(screen.getByTestId('ww-truth')).toBeTruthy();
      fireEvent.click(screen.getByTestId('ww-next'));
    }
    expect(screen.getByTestId('ww-summary').textContent).toMatch(/Total: [\d,]+ \/ 50,000/);
    expect(calls.results).toHaveLength(1);
    expect(calls.results[0]).toMatchObject({ mode: 'untimed' });
  });
});
