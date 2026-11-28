// @vitest-environment jsdom
import { act as rtlAct, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestServices } from '../../../core/game-engine/test-services';
import { Rng } from '../../../core/game-engine/random';
import { decide } from '../ai';
import { currentPlayer, newStar, type Action, type Star } from '../engine';
import { Game } from '../Game';
import { agendaIndex } from '../world';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = async (ms: number) => {
  await rtlAct(async () => {
    vi.advanceTimersByTime(ms);
  });
};
const click = (id: string) => fireEvent.click(screen.getByTestId(id));
const savedState = (s: ReturnType<typeof createTestServices>) =>
  (s.getSaved() as { state: Star | null } | undefined)?.state ?? null;

/** Makes a move the way a player would: the map, the panels, the buttons. */
function perform(a: Action) {
  switch (a.t) {
    case 'pick':
      return click(`sc-pick-${a.card}`);
    case 'activate': {
      const hex = screen.getByTestId(`sc-sys-${a.sys}`);
      if (hex.getAttribute('data-selected') !== 'true') fireEvent.click(hex);
      return click('sc-activate');
    }
    case 'move':
      for (let k = 0; k < a.n; k++) click(`sc-move-${a.from}-${a.kind}`);
      return;
    case 'land':
      for (let k = 0; k < a.n; k++) click(`sc-land-${a.planet}`);
      return;
    case 'build':
      return click(`sc-build-${a.kind}`);
    case 'unbuild':
      return click(`sc-unbuild-${a.kind}`);
    case 'play': {
      const ids =
        a.x < 0 ? [`sc-play-${a.card}`, `sc-play-${a.card}-none`] : [`sc-play-${a.card}-${a.x}`];
      const id = ids.find((x) => screen.queryByTestId(x))!;
      return click(id);
    }
    case 'follow':
      return click(a.x < 0 ? 'sc-follow' : `sc-follow-${a.x}`);
    case 'score':
      return click(`sc-score-${a.obj}`);
    case 'vote':
      return click(`sc-vote-${a.option}`);
    case 'done':
    case 'roll':
    case 'retreat':
    case 'decline':
    case 'pass':
    case 'skip':
    case 'abstain':
      return click(`sc-${a.t}`);
  }
}

describe('Star Council UI', () => {
  it('plays two rounds of a three-player game through the table against envoys', async () => {
    vi.useFakeTimers();
    const svc = createTestServices({ launchParams: { deal: '4' } });
    render(<Game services={svc.services} />);
    await settle(0);
    click('sc-count-3');
    click('sc-level-envoy');
    click('sc-faction-hesh');
    click('sc-start');
    await settle(10);
    expect(savedState(svc)!.ps[0]!.faction).toBe(2);
    const rng = new Rng(3);
    const kinds = new Set<string>();
    for (let i = 0; i < 4000; i++) {
      const g = savedState(svc)!;
      if (g.round >= 3 || g.phase === 'over') break;
      if (currentPlayer(g) === 0) {
        const a = decide(g, 'regent', rng);
        perform(a);
        kinds.add(a.t);
        expect(savedState(svc)).not.toEqual(g);
      }
      await settle(700);
    }
    const g = savedState(svc)!;
    expect(g.round).toBeGreaterThanOrEqual(3);
    expect([...kinds]).toEqual(
      expect.arrayContaining(['pick', 'activate', 'move', 'done', 'play', 'pass']),
    );
    expect(screen.getByTestId('sc-round').textContent).toMatch(/Round 3 of 8/);
  }, 120_000);

  it('the council vote, the status panel and resume', async () => {
    vi.useFakeTimers();
    const g = newStar(2, 4);
    g.phase = 'council';
    g.nexusTaken = true;
    g.speaker = 1;
    g.council = { agenda: agendaIndex('laureate'), queue: [0, 1], votes: [] };
    const first = createTestServices(
      {},
      { state: g, level: 'humans', record: { played: 0, won: 0, best: 0 } },
    );
    const view = render(<Game services={first.services} />);
    await settle(0);
    click('sc-resume');
    await settle(10);
    expect(screen.getByTestId('sc-prompt').textContent).toMatch(/vote on Council Laureate/);
    expect(screen.getByTestId('sc-council').textContent).toMatch(/they gain 1 point/);
    click('sc-vote-0');
    expect(screen.getByTestId('sc-council').textContent).toMatch(/for “/);
    click('sc-abstain');
    const after = savedState(first)!;
    expect(after.ps[0]!.vp).toBe(1);
    expect(after.phase).toBe('strategy');
    expect(screen.getByTestId('sc-log').textContent).toMatch(/The council chose/);
    view.unmount();
    // Resume where it stopped.
    const again = createTestServices({}, first.getSaved());
    render(<Game services={again.services} />);
    await settle(0);
    click('sc-resume');
    await settle(10);
    expect(screen.getByTestId('sc-phase').textContent).toMatch(/Strategy/);
    expect(screen.getByTestId('sc-round').textContent).toMatch(/Round 2 of 8/);
  });
});
