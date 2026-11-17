// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { loadDoodles, loadModel } from '../../shared/doodle/doodle';
import { Game } from '../Game';
import { WORDS } from '../engine';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('Doodle Recognizer UI', () => {
  it('recognizes a real doodle drawn on the pad, and the rest time out into a summary', async () => {
    await loadModel();
    const doodles = await loadDoodles();
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'],
    });
    const { services, calls } = createTestServices({ launchParams: { deal: '11' } });
    render(<Game services={services} />);
    await act(async () => {
      await Promise.resolve();
    });
    await settle(10);
    fireEvent.click(screen.getByTestId('dr-start'));
    const text = screen.getByTestId('dr-word').textContent!;
    const word = WORDS.find(
      (w) => w.split('/')[0] === text.toLowerCase() || text.toLowerCase().startsWith(w),
    )!;
    fireEvent.click(screen.getByTestId('dr-go'));
    // Draw one of the reference doodles for that word, stroke by stroke.
    const pad = screen.getByTestId('dr-pad');
    pad.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 256,
      height: 256,
      right: 256,
      bottom: 256,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const doodle = doodles[word]![0]!;
    for (const [xs, ys] of doodle) {
      fireEvent.pointerDown(pad, { clientX: xs[0], clientY: ys[0], pointerId: 1 });
      for (let i = 1; i < xs.length; i++)
        fireEvent.pointerMove(pad, { clientX: xs[i], clientY: ys[i], pointerId: 1 });
      fireEvent.pointerUp(pad, { pointerId: 1 });
    }
    await settle(1000);
    expect(screen.getByTestId('dr-speech').textContent).toMatch(/I know|I see/);
    // Let every other round run out (or skip).
    for (let i = 0; i < 40 && !screen.queryByTestId('dr-summary'); i++) {
      if (screen.queryByTestId('dr-go')) fireEvent.click(screen.getByTestId('dr-go'));
      else if (
        screen.queryByTestId('dr-skip') &&
        !(screen.getByTestId('dr-skip') as HTMLButtonElement).disabled
      )
        fireEvent.click(screen.getByTestId('dr-skip'));
      await settle(2000);
    }
    expect(screen.getByTestId('dr-summary').textContent).toMatch(/of your 6 drawings/);
    expect(calls.results).toHaveLength(1);
    expect(screen.getAllByTestId(/^dr-tile-/)).toHaveLength(6);
  });
});
