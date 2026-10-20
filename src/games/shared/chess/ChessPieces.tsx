/**
 * Original chess piece set drawn for this project (100×100 artboard): flat silhouettes on a common
 * plinth, warm ivory for White and slate for Black, with a few incised detail lines.
 */
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK, type Color } from './position';

const BASE = 'M24 89 V82 Q24 77 30 77 H70 Q76 77 76 82 V89 Z';

const BODIES: Record<number, string> = {
  [PAWN]: 'M34 77 Q37 62 42 55 Q37 53 38 49 H62 Q63 53 58 55 Q63 62 66 77 Z',
  [ROOK]: 'M33 77 L36 46 L30 41 V20 H39 V27 H45.5 V20 H54.5 V27 H61 V20 H70 V41 L64 46 L67 77 Z',
  [KNIGHT]:
    'M36 77 C36 67 41 60 48 55 C42 55 36 58 31 61 C26 64 21 60 22 55 C23 51 27 49 31 46 L43 34 C45 27 49 23 53 21 L55 13 L60 21 C71 25 77 37 77 51 C77 62 74 70 70 77 Z',
  [BISHOP]: 'M37 77 L42 66 Q32 58 34 44 Q37 31 50 21 Q63 31 66 44 Q68 58 58 66 L63 77 Z',
  [QUEEN]:
    'M33 77 L29 58 L18 31 L33 48 L35 24 L45 46 L50 20 L55 46 L65 24 L67 48 L82 31 L71 58 L67 77 Z',
  [KING]:
    'M34 77 L31 60 Q16 53 19 41 Q24 31 39 38 Q43 30 50 30 Q57 30 61 38 Q76 31 81 41 Q84 53 69 60 L66 77 Z',
};

/** Extra shapes drawn with the body fill (heads, balls, crosses). */
function Extras({ type }: { type: number }) {
  switch (type) {
    case PAWN:
      return <circle cx="50" cy="35" r="13" />;
    case BISHOP:
      return <circle cx="50" cy="15" r="5.5" />;
    case QUEEN:
      return (
        <>
          {[
            [18, 27],
            [35, 20],
            [50, 15],
            [65, 20],
            [82, 27],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="5" />
          ))}
        </>
      );
    case KING:
      return <path d="M46.5 6 H53.5 V13 H60 V20 H53.5 V30 H46.5 V20 H40 V13 H46.5 Z" />;
    default:
      return null;
  }
}

/** Incised details drawn in the outline color. */
function Details({ type, color }: { type: number; color: string }) {
  switch (type) {
    case ROOK:
      return <path d="M36 46 H64 M34 70 H66" />;
    case KNIGHT:
      return (
        <>
          <circle cx="51" cy="32" r="3" fill={color} stroke="none" />
          <path d="M58 24 C66 30 69 40 68 52" />
        </>
      );
    case BISHOP:
      return <path d="M55 33 L46 46 M40 66 H60" />;
    case QUEEN:
      return <path d="M30 60 H70" />;
    case KING:
      return <path d="M31 61 H69 M50 38 V58" />;
    case PAWN:
      return <path d="M38 50 H62" />;
    default:
      return null;
  }
}

export const PIECE_COLORS: Record<Color, { fill: string; line: string }> = {
  0: { fill: '#fbf5e6', line: '#3b2e22' },
  1: { fill: '#34303c', line: '#0e0c12' },
};

export function PieceGlyph({
  type,
  color,
  size,
  className,
}: {
  type: number;
  color: Color;
  size?: number | string;
  className?: string;
}) {
  const c = PIECE_COLORS[color];
  const detail = color === 0 ? c.line : '#a9a1b8';
  return (
    <svg
      viewBox="6 4 88 88"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g fill={c.fill} stroke={c.line} strokeWidth="3.5" strokeLinejoin="round">
        <path d={BASE} />
        <path d={BODIES[type]} />
        <Extras type={type} />
      </g>
      <g fill="none" stroke={detail} strokeWidth="2.6" strokeLinecap="round">
        <Details type={type} color={detail} />
      </g>
    </svg>
  );
}
