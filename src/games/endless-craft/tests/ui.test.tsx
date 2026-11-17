// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Game } from '../Game';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const tap = (el: HTMLElement) => {
  fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
};

describe('Endless Craft UI', () => {
  it('places, combines, discovers, hints, saves and resets', async () => {
    const { services, calls } = createTestServices();
    const view = render(<Game services={services} />);
    await act(async () => {});
    expect(screen.getByTestId('ec-count').textContent).toMatch(/4 \/ 225/);
    // Combine the starting water and fire chips by tapping one then the other.
    tap(screen.getByTestId('ec-chip-water'));
    tap(screen.getByTestId('ec-chip-fire'));
    expect(screen.getByTestId('ec-toast').textContent).toMatch(/New discovery: ♨️ Steam/);
    expect(screen.getByTestId('ec-count').textContent).toMatch(/5 \/ 225/);
    expect(screen.getByTestId('ec-item-steam')).toBeTruthy();
    expect(calls.achievements).toContain('first');
    // Tap a list item to place it, then use the keyboard to combine.
    tap(screen.getByTestId('ec-item-earth'));
    const earths = screen.getAllByTestId('ec-chip-earth');
    expect(earths).toHaveLength(2);
    fireEvent.keyDown(earths[0]!, { key: 'Enter' });
    fireEvent.keyDown(earths[1]!, { key: 'Enter' });
    expect(screen.getByTestId('ec-chip-mountain')).toBeTruthy();
    // Nothing happens for an unknown pair.
    tap(screen.getByTestId('ec-chip-mountain'));
    tap(screen.getByTestId('ec-chip-steam'));
    expect(screen.getByTestId('ec-toast').textContent).toMatch(/Nothing happens/);
    fireEvent.click(screen.getByTestId('ec-hint'));
    expect(screen.getByTestId('ec-toast').textContent).toMatch(/Try combining/);
    fireEvent.change(screen.getByTestId('ec-search'), { target: { value: 'moun' } });
    expect(screen.getByTestId('ec-list').textContent).toBe('⛰️Mountain');
    fireEvent.click(screen.getByTestId('ec-clear'));
    expect(screen.queryByTestId('ec-chip-mountain')).toBeNull();
    // Leaving records the session's discoveries.
    view.unmount();
    expect(calls.results.at(-1)).toMatchObject({ score: 6, mode: 'sandbox' });
    // The save restores progress; reset starts over.
    render(<Game services={services} />);
    await act(async () => {});
    expect(screen.getByTestId('ec-count').textContent).toMatch(/6 \/ 225/);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByTestId('ec-reset'));
    expect(screen.getByTestId('ec-count').textContent).toMatch(/4 \/ 225/);
  });
});
