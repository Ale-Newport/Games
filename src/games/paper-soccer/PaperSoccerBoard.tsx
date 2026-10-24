import type { BoardProps } from '../shared/two-player/TwoPlayerGame';
import { useKeyboard } from '../../core/input/keyboard';
import {
  DX,
  DY,
  H,
  W,
  canMove,
  isPoint,
  pointAt,
  pointX,
  pointY,
  type PaperSoccerState,
} from './engine';
import styles from './PaperSoccerBoard.module.css';

const DIR_KEYS: Record<string, number> = {
  ArrowUp: 0,
  ArrowRight: 2,
  ArrowDown: 4,
  ArrowLeft: 6,
  '8': 0,
  '9': 1,
  '6': 2,
  '3': 3,
  '2': 4,
  '1': 5,
  '4': 6,
  '7': 7,
};

const DIR_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function PaperSoccerBoard({
  state,
  interactive,
  hint,
  animate,
  t,
  onAction,
  perspective,
}: BoardProps<PaperSoccerState, string>) {
  const flip = perspective === 1;
  const bx = pointX(state.ball);
  const by = pointY(state.ball);
  const legal = interactive
    ? [0, 1, 2, 3, 4, 5, 6, 7].filter((d) => canMove(state.edges, state.ball, d))
    : [];
  useKeyboard((e) => {
    const d = DIR_KEYS[e.key];
    if (d === undefined) return false;
    const dir = flip ? (d + 4) % 8 : d;
    if (legal.includes(dir)) onAction(String(dir));
    return true;
  });
  const hintDir = hint === null || hint === undefined ? null : Number(hint);
  const lastLine = state.lines[state.lines.length - 1];
  const P = (p: number) => ({ x: pointX(p), y: pointY(p) });
  const dots: { x: number; y: number }[] = [];
  for (let y = -1; y <= H + 1; y++)
    for (let x = 0; x <= W; x++) if (isPoint(x, y)) dots.push({ x, y });
  const mouth = [W / 2 - 1, W / 2 + 1];
  const border = [
    `M${mouth[0]} 0 L0 0 L0 ${H} L${mouth[0]} ${H} L${mouth[0]} ${H + 1} L${mouth[1]} ${H + 1} L${mouth[1]} ${H} L${W} ${H} L${W} 0 L${mouth[1]} 0 L${mouth[1]} -1 L${mouth[0]} -1 Z`,
  ];
  return (
    <div className={`${styles.wrap} ${animate ? styles.animated : ''}`} data-testid="soccer-board">
      <svg
        viewBox={`-0.7 -1.7 ${W + 1.4} ${H + 3.4}`}
        className={styles.svg}
        role="group"
        aria-label={t('board.label')}
      >
        <g transform={flip ? `rotate(180 ${W / 2} ${H / 2})` : undefined}>
          <path d={border[0]} className={styles.field} />
          <rect x={mouth[0]} y={-1} width={2} height={1} className={styles.goal1} />
          <rect x={mouth[0]} y={H} width={2} height={1} className={styles.goal0} />
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} className={styles.mark} />
          <circle cx={W / 2} cy={H / 2} r={1.2} className={styles.mark} />
          {dots.map(({ x, y }) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r={0.06} className={styles.dot} />
          ))}
          <path d={border[0]} className={styles.border} />
          {state.lines.map(([f, to, seat], i) => (
            <line
              key={i}
              x1={P(f).x}
              y1={P(f).y}
              x2={P(to).x}
              y2={P(to).y}
              className={`${seat === 0 ? styles.line0 : styles.line1} ${i === state.lines.length - 1 ? styles.newest : ''}`}
            />
          ))}
          {hintDir !== null && (
            <line
              x1={bx}
              y1={by}
              x2={bx + DX[hintDir]!}
              y2={by + DY[hintDir]!}
              className={styles.hint}
            />
          )}
          {legal.map((d) => (
            <circle key={d} cx={bx + DX[d]!} cy={by + DY[d]!} r={0.16} className={styles.target} />
          ))}
          <g
            key={state.ball}
            transform={`translate(${bx} ${by})`}
            className={`${styles.ball} ${lastLine ? styles.rolled : ''}`}
          >
            <circle r={0.3} className={styles.ballBody} />
            <path
              d="M0 -0.12 L0.11 -0.04 L0.07 0.1 L-0.07 0.1 L-0.11 -0.04 Z"
              className={styles.ballPatch}
            />
          </g>
          {legal.map((d) => {
            const x = bx + DX[d]!;
            const y = by + DY[d]!;
            return (
              <circle
                key={`hit-${d}`}
                cx={x}
                cy={y}
                r={0.48}
                className={styles.hit}
                data-dir={d}
                data-point={pointAt(x, y)}
                role="button"
                aria-label={t('point.kick', { dir: t(`dir.${DIR_NAMES[d]}`) })}
                onClick={() => onAction(String(d))}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
