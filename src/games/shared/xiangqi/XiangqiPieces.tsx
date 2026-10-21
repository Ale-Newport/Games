/** Original round xiangqi pieces drawn for this project (ivory discs with ink characters). */
import type { Side } from './position';

/** Characters per piece type for Red and Black (traditional pairs). */
const GLYPHS: Record<Side, string[]> = {
  0: ['', '帥', '仕', '相', '傌', '俥', '炮', '兵'],
  1: ['', '將', '士', '象', '馬', '車', '砲', '卒'],
};
const LATIN = ['', 'K', 'A', 'E', 'H', 'R', 'C', 'P'];

/** Original round piece: ivory disc, inner ring, character in the side's ink. */
export function XiangqiPiece({ type, side }: { type: number; side: Side }) {
  const ink = side === 0 ? '#b3261e' : '#1c2a33';
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="45" fill="#f6ead0" stroke="#6b4a2b" strokeWidth="3" />
      <circle cx="42" cy="40" r="30" fill="#fffaf0" opacity="0.45" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={ink} strokeWidth="2.5" />
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontSize="40"
        fontWeight="700"
        fontFamily="'Kaiti SC', 'STKaiti', 'Noto Serif SC', 'Noto Serif CJK SC', 'Songti SC', serif"
        fill={ink}
      >
        {GLYPHS[side][type]}
      </text>
      <text
        x="50"
        y="83"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
        fill={ink}
        opacity="0.7"
      >
        {LATIN[type]}
      </text>
    </svg>
  );
}
