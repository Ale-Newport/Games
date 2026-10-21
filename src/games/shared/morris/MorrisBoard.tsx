import { useMemo, useState } from 'react';
import { useKeyboard } from '../../../core/input/keyboard';
import type { BoardProps } from '../two-player/TwoPlayerGame';
import { legalMorrisMoves, moveName, type MorrisState, type MorrisVariant } from './engine';
import styles from './MorrisBoard.module.css';

type Step =
  { kind: 'idle' } | { kind: 'piece'; from: number } | { kind: 'remove'; from: number; to: number };

export function createMorrisBoard(v: MorrisVariant) {
  const span = Math.max(...v.points.map((p) => p.charCodeAt(0) - 96));
  const cell = 100 / (span + 1);
  const xy = (name: string) => ({
    x: (name.charCodeAt(0) - 96) * cell,
    y: (span + 1 - Number(name.slice(1))) * cell,
  });
  const coords = v.points.map(xy);
  const index = new Map(v.points.map((p, i) => [p, i]));

  return function MorrisBoard({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
  }: BoardProps<MorrisState, string>) {
    const moves = useMemo(
      () => (interactive ? legalMorrisMoves(v, state) : []),
      [state, interactive],
    );
    const [step, setStep] = useState<Step>({ kind: 'idle' });
    const [turn, setTurn] = useState(state.history.length);
    if (turn !== state.history.length) {
      setTurn(state.history.length);
      setStep({ kind: 'idle' });
    }
    const placing = state.inHand[state.toMove] > 0;
    const finish = (from: number, to: number) => {
      const options = moves.filter((m) => m.from === from && m.to === to);
      if (options.length === 0) return onAction('');
      if (options.some((m) => m.remove >= 0)) setStep({ kind: 'remove', from, to });
      else {
        setStep({ kind: 'idle' });
        onAction(moveName(v, options[0]!));
      }
    };
    const click = (p: number) => {
      if (!interactive) return;
      if (step.kind === 'remove') {
        const m = moves.find((x) => x.from === step.from && x.to === step.to && x.remove === p);
        if (m) {
          setStep({ kind: 'idle' });
          onAction(moveName(v, m));
        }
        return;
      }
      if (placing) return finish(-1, p);
      if (step.kind === 'piece' && moves.some((m) => m.from === step.from && m.to === p))
        return finish(step.from, p);
      if (moves.some((m) => m.from === p)) return setStep({ kind: 'piece', from: p });
      setStep({ kind: 'idle' });
      if (state.board[p] === state.toMove + 1) onAction('');
    };
    useKeyboard((e) => {
      if (e.key === 'Escape' && step.kind !== 'idle' && step.kind !== 'remove') {
        setStep({ kind: 'idle' });
        return true;
      }
      return false;
    });
    const targets = new Set<number>();
    const removals = new Set<number>();
    if (step.kind === 'piece')
      moves.filter((m) => m.from === step.from).forEach((m) => targets.add(m.to));
    if (step.kind === 'remove')
      moves
        .filter((m) => m.from === step.from && m.to === step.to)
        .forEach((m) => removals.add(m.remove));
    if (placing && step.kind === 'idle') moves.forEach((m) => targets.add(m.to));
    const shown = state.board.slice();
    if (step.kind === 'remove') {
      if (step.from >= 0) shown[step.from] = 0;
      shown[step.to] = state.toMove + 1;
    }
    const last = state.history[state.history.length - 1];
    // Destination of the last move: "e4", "e4xd7", "d6-d5" or "d6-d5xa1".
    const lastTo = last ? index.get(last.split('x')[0]!.split('-').pop()!) : undefined;
    const hintParts = hint
      ? hint
          .split('x')[0]!
          .split('-')
          .map((n) => index.get(n))
      : [];
    const tray = (seat: 0 | 1) => (
      <div
        className={styles.tray}
        data-testid={`tray-${seat}`}
        aria-label={t('tray.label', { seat: t(`seat.${seat}`), n: state.inHand[seat] })}
      >
        {Array.from({ length: state.inHand[seat] }, (_, k) => (
          <span
            key={k}
            className={`${styles.trayPiece} ${seat === 0 ? styles.white : styles.black}`}
          />
        ))}
      </div>
    );
    return (
      <div
        className={`${styles.wrap} ${animate ? styles.animated : ''}`}
        data-testid="morris-board"
      >
        {tray(1)}
        <svg viewBox="0 0 100 100" className={styles.svg} role="grid" aria-label={t('board.label')}>
          <rect x="1" y="1" width="98" height="98" rx="4" className={styles.wood} />
          {/* Target glows sit under the lines so the board stays readable. */}
          {coords.map(({ x, y }, p) =>
            targets.has(p) ? (
              <circle
                key={`t${p}`}
                cx={x}
                cy={y}
                r={cell * 0.42}
                className={styles.target}
                pointerEvents="none"
              />
            ) : null,
          )}
          {v.edges.map(([a, b]) => {
            const p = xy(a);
            const q = xy(b);
            return (
              <line key={`${a}${b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={styles.line} />
            );
          })}
          {coords.map(({ x, y }, p) => {
            const stone = shown[p]!;
            const label = `${v.points[p]}, ${t(stone === 0 ? 'point.empty' : stone === 1 ? 'point.white' : 'point.black')}${removals.has(p) ? `, ${t('point.removable')}` : targets.has(p) ? `, ${t('point.target')}` : ''}`;
            const selected = step.kind === 'piece' && step.from === p;
            return (
              <g key={p}>
                <circle
                  cx={x}
                  cy={y}
                  r={cell * 0.42}
                  className={`${styles.hit} ${hintParts.includes(p) ? styles.hint : ''}`}
                  data-point={v.points[p]}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={label}
                  onClick={() => click(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      click(p);
                    }
                  }}
                />
                {stone === 0 && (
                  <circle
                    cx={x}
                    cy={y}
                    r={cell * 0.1}
                    className={styles.dot}
                    pointerEvents="none"
                  />
                )}
                {stone !== 0 && (
                  <circle
                    key={lastTo === p ? `placed-${state.history.length}` : 'still'}
                    cx={x}
                    cy={y}
                    r={cell * 0.34}
                    className={`${stone === 1 ? styles.white : styles.black} ${selected ? styles.selected : ''} ${removals.has(p) ? styles.removable : ''} ${lastTo === p ? styles.placed : ''}`}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>
        {tray(0)}
        {step.kind === 'remove' && (
          <p className={styles.prompt} role="status">
            {t('prompt.remove')}
          </p>
        )}
      </div>
    );
  };
}

export function MorrisSeatIcon({ seat, size }: { seat: 0 | 1; size: number }) {
  return (
    <svg width={size + 2} height={size + 2} viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={seat === 0 ? '#f4ead2' : '#2b2420'}
        stroke={seat === 0 ? '#a8895c' : '#6b5a4a'}
        strokeWidth="2"
      />
    </svg>
  );
}
