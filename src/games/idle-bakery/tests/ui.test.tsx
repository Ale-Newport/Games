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

describe('Idle Bakery UI', () => {
  it('bakes by clicking, buys a cursor that bakes alone, catches a golden pastry, and saves', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'],
    });
    const { services, calls } = createTestServices({ launchParams: { deal: '2' } });
    const view = render(<Game services={services} />);
    await act(async () => {});
    await settle(100);
    const cookie = screen.getByTestId('ib-cookie');
    for (let i = 0; i < 20; i++) fireEvent.pointerDown(cookie, { clientX: 5, clientY: 5 });
    expect(screen.getByTestId('ib-cookies').textContent).toBe('20 cookies');
    fireEvent.click(screen.getByTestId('ib-buy-cursor'));
    expect(screen.getByTestId('ib-cookies').textContent).toBe('5 cookies');
    expect(screen.getByTestId('ib-cps').textContent).toMatch(/0\.1/);
    for (let i = 0; i < 10; i++) await settle(1000);
    expect(screen.getByTestId('ib-cookies').textContent).toBe('6 cookies');
    // Wait for a golden pastry (within three minutes) and catch it.
    for (let i = 0; i < 400 && !screen.queryByTestId('ib-golden'); i++) await settle(500);
    fireEvent.click(screen.getByTestId('ib-golden'));
    expect(screen.getByTestId('ib-message').textContent).toMatch(/Lucky|Frenzy|frenzy/);
    expect(calls.achievements).toContain('golden');
    view.unmount();
    expect(calls.results.at(-1)).toMatchObject({ mode: 'classic' });
    // Coming back restores the bakery (plus a little offline baking).
    render(<Game services={services} />);
    await act(async () => {});
    await settle(100);
    expect(screen.getByTestId('ib-buy-cursor').textContent).toMatch(/1$/);
  });
});
