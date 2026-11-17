// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Painted Night Ride UI', () => {
  it('pedals with the keyboard, pauses, and the AI finishes a ride to the end screen', async () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'Date',
        'queueMicrotask',
      ],
    });
    const { services } = createTestServices({ launchParams: { deal: '5' } });
    render(<Game services={services} />);
    fireEvent.click(screen.getByTestId('nr-start'));
    fireEvent.keyDown(window, { code: 'KeyW', key: 'w' });
    await settle(2000);
    fireEvent.keyUp(window, { code: 'KeyW', key: 'w' });
    expect(screen.getByTestId('nr-time').textContent).toMatch(/0:0[12]/);
    fireEvent.click(screen.getByTestId('nr-pause'));
    expect(screen.getByTestId('nr-overlay')).toBeTruthy();
    fireEvent.click(screen.getByTestId('nr-resume-run'));
    fireEvent.click(screen.getByTestId('nr-menu-btn'));
    // Watch the AI ride a whole Starlight round.
    fireEvent.click(screen.getByTestId('nr-watch'));
    for (let i = 0; i < 400 && !screen.queryByTestId('nr-end'); i++) await settle(1000);
    expect(screen.getByTestId('nr-delivered').textContent).toMatch(/12\/12/);
    expect(screen.getByTestId('nr-summary').textContent).toMatch(/score/);
  }, 120_000);
});
