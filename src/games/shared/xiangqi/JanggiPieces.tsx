/** Original octagonal janggi pieces drawn for this project; size follows the piece's rank. */
import type { Side } from './position';

const GLYPHS: Record<Side, string[]> = {
  0: ['', '楚', '士', '象', '馬', '車', '包', '卒'],
  1: ['', '漢', '士', '象', '馬', '車', '包', '兵'],
};
const LATIN = ['', 'K', 'A', 'E', 'H', 'R', 'C', 'P'];
const SIZE = [1, 1, 0.74, 0.86, 0.86, 0.86, 0.86, 0.74];

function octagon(r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 8) * (2 * i + 1);
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function JanggiPiece({ type, side }: { type: number; side: Side }) {
  const ink = side === 0 ? '#1f5f8b' : '#b3261e';
  const r = 46 * SIZE[type]!;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <polygon points={octagon(r)} fill="#f3e6c8" stroke="#6b4a2b" strokeWidth="3" />
      <polygon points={octagon(r - 7)} fill="none" stroke={ink} strokeWidth="2" />
      <text
        x="50"
        y={50 + r * 0.3}
        textAnchor="middle"
        fontSize={r * 0.95}
        fontWeight="700"
        fontFamily="'Noto Serif KR', 'Noto Serif CJK KR', 'Batang', 'Songti SC', serif"
        fill={ink}
      >
        {GLYPHS[side][type]}
      </text>
      <text
        x="50"
        y={50 + r * 0.78}
        textAnchor="middle"
        fontSize={r * 0.26}
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
        fill={ink}
        opacity="0.75"
      >
        {LATIN[type]}
      </text>
    </svg>
  );
}

export function JanggiSeatIcon({ seat, size }: { seat: 0 | 1; size: number }) {
  return (
    <span style={{ display: 'grid', width: size + 6, height: size + 6 }}>
      <JanggiPiece type={1} side={seat} />
    </span>
  );
}
