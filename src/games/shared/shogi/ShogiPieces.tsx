/**
 * Original piece artwork for the shogi family, drawn for this project: wedge-shaped wooden
 * pieces with kanji for shogi, and rounded animal tiles with movement dots for animal shogi.
 */
import type { ShogiVariant } from './variants';

/** Kanji per kind index for standard shogi (Sente's king is 玉, Gote's 王). */
const KANJI: Record<number, string> = {
  2: '飛',
  3: '角',
  4: '金',
  5: '銀',
  6: '桂',
  7: '香',
  8: '歩',
  9: '龍',
  10: '馬',
  11: '全',
  12: '圭',
  13: '杏',
  14: 'と',
};
const SCALE: Record<number, number> = {
  1: 1,
  2: 0.97,
  3: 0.97,
  4: 0.93,
  5: 0.93,
  6: 0.89,
  7: 0.89,
  8: 0.85,
};

function ShogiKoma({
  kind,
  owner,
  letter,
  base,
}: {
  kind: number;
  owner: 0 | 1;
  letter: string;
  base: number;
}) {
  const promoted = kind >= 9;
  const glyph = kind === 1 ? (owner === 0 ? '玉' : '王') : KANJI[kind]!;
  const s = SCALE[base] ?? 0.9;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g
        transform={`rotate(${owner === 1 ? 180 : 0} 50 50) translate(50 54) scale(${s}) translate(-50 -54)`}
      >
        <path
          d="M50 6 L80 18 L90 96 L10 96 L20 18 Z"
          fill="url(#koma-wood)"
          stroke="#7b5326"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="66"
          textAnchor="middle"
          fontSize="44"
          fontWeight="700"
          fontFamily="'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', 'Noto Serif CJK JP', serif"
          fill={promoted ? '#b3261e' : '#1d1410'}
        >
          {glyph}
        </text>
        <text
          x="50"
          y="90"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
          fill={promoted ? '#b3261e' : '#6b4a2b'}
          opacity="0.85"
        >
          {letter}
        </text>
      </g>
    </svg>
  );
}

const TILE = { 0: { fill: '#ffe1a1', line: '#b0752b' }, 1: { fill: '#cfe4ff', line: '#4a76b0' } };

/** Simple original animal drawings on a 100×100 tile (facing up = forward). */
function Animal({ kind }: { kind: number }) {
  switch (kind) {
    case 1: // lion: mane + face
      return (
        <g>
          <circle cx="50" cy="50" r="24" fill="#e58b2b" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={50 + Math.cos(a) * 24}
                cy={50 + Math.sin(a) * 24}
                r="7"
                fill="#c96a17"
              />
            );
          })}
          <circle cx="50" cy="52" r="15" fill="#f6c46b" />
          <circle cx="44" cy="49" r="2.4" fill="#3a2410" />
          <circle cx="56" cy="49" r="2.4" fill="#3a2410" />
          <path d="M46 57 Q50 61 54 57" stroke="#3a2410" strokeWidth="2.2" fill="none" />
        </g>
      );
    case 2: // giraffe: neck and head with spots
      return (
        <g>
          <path
            d="M44 80 L44 40 Q44 28 54 26 L64 26 Q70 30 64 36 L56 38 L56 80 Z"
            fill="#f2c14e"
            stroke="#a8741c"
            strokeWidth="2"
          />
          <circle cx="49" cy="52" r="3.5" fill="#a8741c" />
          <circle cx="51" cy="66" r="3" fill="#a8741c" />
          <circle cx="49" cy="76" r="2.5" fill="#a8741c" />
          <line x1="52" y1="26" x2="50" y2="18" stroke="#a8741c" strokeWidth="2.5" />
          <circle cx="60" cy="30" r="1.8" fill="#3a2410" />
        </g>
      );
    case 3: // elephant: head, ears and trunk
      return (
        <g>
          <ellipse cx="30" cy="48" rx="13" ry="16" fill="#9fa8c7" />
          <ellipse cx="70" cy="48" rx="13" ry="16" fill="#9fa8c7" />
          <circle cx="50" cy="46" r="18" fill="#b9c1dc" />
          <path d="M46 56 Q44 72 52 80 Q56 82 56 76 Q52 70 54 56 Z" fill="#b9c1dc" />
          <circle cx="43" cy="42" r="2.4" fill="#2b2f45" />
          <circle cx="57" cy="42" r="2.4" fill="#2b2f45" />
        </g>
      );
    case 4: // chick
      return (
        <g>
          <circle cx="50" cy="54" r="20" fill="#ffd93b" />
          <path d="M50 36 L56 44 L44 44 Z" fill="#f29f05" />
          <circle cx="44" cy="52" r="2.4" fill="#3a2410" />
          <circle cx="56" cy="52" r="2.4" fill="#3a2410" />
        </g>
      );
    default: // hen: bigger bird with a red comb
      return (
        <g>
          <ellipse
            cx="50"
            cy="56"
            rx="22"
            ry="20"
            fill="#fff7ea"
            stroke="#d9c4a0"
            strokeWidth="2"
          />
          <path d="M42 34 Q46 26 50 33 Q54 26 58 34 Z" fill="#e0433a" />
          <path d="M50 38 L57 46 L43 46 Z" fill="#f29f05" />
          <circle cx="44" cy="53" r="2.4" fill="#3a2410" />
          <circle cx="56" cy="53" r="2.4" fill="#3a2410" />
        </g>
      );
  }
}

function AnimalTile({ v, kind, owner }: { v: ShogiVariant; kind: number; owner: 0 | 1 }) {
  const c = TILE[owner];
  const dirs = v.kinds[kind]!.steps;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g transform={`rotate(${owner === 1 ? 180 : 0} 50 50)`}>
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="16"
          fill={c.fill}
          stroke={c.line}
          strokeWidth="3"
        />
        <Animal kind={kind} />
        {dirs.map(([dr, dc]) => (
          <circle key={`${dr},${dc}`} cx={50 + dc * 36} cy={50 + dr * 36} r="4.5" fill={c.line} />
        ))}
      </g>
    </svg>
  );
}

/** Shared gradient for wooden shogi pieces (render once per board). */
export function KomaDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="koma-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7e2b2" />
          <stop offset="1" stopColor="#e2bd7a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PieceArt({ v, kind, owner }: { v: ShogiVariant; kind: number; owner: 0 | 1 }) {
  if (v.goal === 'capture') return <AnimalTile v={v} kind={kind} owner={owner} />;
  const def = v.kinds[kind]!;
  return <ShogiKoma kind={kind} owner={owner} letter={def.letter} base={def.base} />;
}
