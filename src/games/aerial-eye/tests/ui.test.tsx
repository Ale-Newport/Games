// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { DATA } from '../ai-adapter';
import { current, dayNumber, newDaily, next, pick, type Session } from '../engine';
import { Game } from '../Game';

afterEach(cleanup);

/** The daily's rounds (target and options), computed the same way as the game. */
function dailyRounds() {
  let s: Session = newDaily(DATA, dayNumber());
  const out = [];
  for (let i = 0; i < 5; i++) {
    out.push({ ...current(s) });
    s = pick(s, current(s).target);
    if (i < 4) s = next(s, DATA);
  }
  return out;
}

describe('Aerial Eye UI', () => {
  it('plays the daily: a miss zooms out, picks by click and keyboard, credit and map on reveal', async () => {
    const rounds = dailyRounds();
    const { services, calls } = createTestServices();
    render(<Game services={services} />);
    fireEvent.click(await screen.findByTestId('ae-daily', {}, { timeout: 15_000 }));
    for (let i = 0; i < 5; i++) {
      const r = rounds[i]!;
      expect(screen.getByTestId('ae-round').textContent).toBe(`Photo ${i + 1} / 5`);
      expect(screen.getByTestId('ae-question').textContent).toMatch(/^Which .* is this\?$/);
      const photo = await screen.findByTestId('ae-photo', {}, { timeout: 10_000 });
      expect(photo.getAttribute('data-zoom')).toBe('2.2');
      const at = (place: number) => r.options.indexOf(place);
      if (i === 0) {
        const wrong = r.options.find((o) => o !== r.target)!;
        fireEvent.click(screen.getByTestId(`ae-option-${at(wrong)}`));
        expect(screen.getByTestId('ae-photo').getAttribute('data-zoom')).toBe('1.5');
        expect(screen.getByTestId('ae-wrong').textContent).toMatch(/zooming out/);
        expect((screen.getByTestId(`ae-option-${at(wrong)}`) as HTMLButtonElement).disabled).toBe(
          true,
        );
      }
      if (i === 4) {
        // Three misses.
        for (const o of r.options.filter((o) => o !== r.target).slice(0, 3))
          fireEvent.click(screen.getByTestId(`ae-option-${at(o)}`));
      } else if (i % 2)
        fireEvent.keyDown(screen.getByTestId('ae-play'), { key: String(at(r.target) + 1) });
      else fireEvent.click(screen.getByTestId(`ae-option-${at(r.target)}`));
      expect(screen.getByTestId('ae-answer').textContent).toBe(DATA[r.target]![2]);
      expect(screen.getByTestId('ae-photo').getAttribute('data-zoom')).toBe('1');
      expect(screen.getByTestId('ae-credit').textContent).toMatch(/Wikimedia Commons/);
      expect(await screen.findByTestId('os-map', {}, { timeout: 10_000 })).toBeTruthy();
      fireEvent.click(screen.getByTestId('ae-next'));
    }
    expect(screen.getByTestId('ae-final').textContent).toBe('350 / 500');
    expect(calls.results).toEqual([expect.objectContaining({ mode: 'daily', score: 350 })]);
    expect(calls.achievements).toContain('first-spot');
    fireEvent.click(screen.getByTestId('ae-menu-btn'));
    expect(screen.getByTestId('ae-daily-done')).toBeTruthy();
  });

  it('resumes an endless run of one kind after a reload and ends it', async () => {
    const first = createTestServices({ launchParams: { deal: '9' } });
    const view = render(<Game services={first.services} />);
    fireEvent.click(await screen.findByTestId('ae-cat-island', {}, { timeout: 15_000 }));
    fireEvent.click(screen.getByTestId('ae-endless'));
    expect(screen.getByTestId('ae-question').textContent).toBe('Which island is this?');
    fireEvent.click(screen.getByTestId('ae-option-0'));
    const options = screen.getAllByTestId(/^ae-option-/).map((b) => b.textContent);
    view.unmount();
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    fireEvent.click(await screen.findByTestId('ae-resume', {}, { timeout: 15_000 }));
    expect(screen.getAllByTestId(/^ae-option-/).map((b) => b.textContent)).toEqual(options);
    fireEvent.click(screen.getByTestId('ae-end'));
    await waitFor(() => expect(screen.getByTestId(/^ae-(results|menu)$/)).toBeTruthy());
  });
});
