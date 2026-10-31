/** Original mahjong tile faces drawn in SVG (viewBox 30 × 40), shared by #159 and #160: dots, bamboo, characters, honours, flowers and seasons. */
const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WINDS = ['東', '南', '西', '北'];
const PALETTE = ['#2b6cb0', '#c53030', '#2f855a'];

/** Positions (in a 3 × 3 grid, as [col, row] fractions) for 1–9 marks. */
const GRID: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [1, 0],
    [1, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
  7: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  8: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  9: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
};

const at = ([c, r]: [number, number]) => [6 + c * 9, 8 + r * 12] as const;

function Dots({ n }: { n: number }) {
  return (
    <>
      {GRID[n]!.map((p, i) => {
        const [x, y] = at(p);
        const big = n === 1;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={big ? 9 : 3.6} fill={PALETTE[i % 3]} />
            <circle cx={x} cy={y} r={big ? 4 : 1.4} fill="#fffaf0" />
          </g>
        );
      })}
    </>
  );
}

function Bamboo({ n }: { n: number }) {
  if (n === 1)
    return (
      <g>
        <rect x={13} y={6} width={4} height={28} rx={2} fill="#2f855a" />
        <path d="M15 12 q-8 -2 -9 4 q7 1 9 -4 z M15 20 q8 -2 9 4 q-7 1 -9 -4 z" fill="#68d391" />
      </g>
    );
  return (
    <>
      {GRID[n]!.map((p, i) => {
        const [x, y] = at(p);
        return (
          <rect
            key={i}
            x={x - 1.6}
            y={y - 5}
            width={3.2}
            height={10}
            rx={1.4}
            fill={i % 3 === 1 ? '#c53030' : '#2f855a'}
          />
        );
      })}
    </>
  );
}

function Glyph({
  text,
  colour,
  size = 20,
  y = 27,
}: {
  text: string;
  colour: string;
  size?: number;
  y?: number;
}) {
  return (
    <text
      x={15}
      y={y}
      fontSize={size}
      textAnchor="middle"
      fill={colour}
      fontWeight={700}
      fontFamily="serif"
    >
      {text}
    </text>
  );
}

function Flower({ k, season }: { k: number; season: boolean }) {
  const colour = ['#d53f8c', '#dd6b20', '#3182ce', '#38a169'][k]!;
  return (
    <g>
      {season ? (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect
              key={a}
              x={14}
              y={8}
              width={2}
              height={7}
              fill={colour}
              transform={`rotate(${a} 15 18)`}
            />
          ))}
          <circle cx={15} cy={18} r={4.5} fill={colour} />
        </>
      ) : (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx={15}
              cy={12}
              rx={3.2}
              ry={5.5}
              fill={colour}
              transform={`rotate(${a} 15 18)`}
            />
          ))}
          <circle cx={15} cy={18} r={2.6} fill="#f6e05e" />
        </>
      )}
      <text x={24} y={36} fontSize={7} textAnchor="middle" fill="#4a5568" fontWeight={700}>
        {k + 1}
      </text>
    </g>
  );
}

export function FaceArt({ face }: { face: number }) {
  if (face < 9) return <Dots n={face + 1} />;
  if (face < 18) return <Bamboo n={face - 8} />;
  if (face < 27)
    return (
      <>
        <Glyph text={NUMERALS[face - 18]!} colour="#1a202c" size={13} y={16} />
        <Glyph text="萬" colour="#c53030" size={14} y={34} />
      </>
    );
  if (face < 31) return <Glyph text={WINDS[face - 27]!} colour="#1a202c" />;
  if (face === 31) return <Glyph text="中" colour="#c53030" />;
  if (face === 32) return <Glyph text="發" colour="#2f855a" />;
  if (face === 33)
    return (
      <rect
        x={7}
        y={8}
        width={16}
        height={24}
        rx={2}
        fill="none"
        stroke="#2b6cb0"
        strokeWidth={2.5}
      />
    );
  return <Flower k={(face - 34) % 4} season={face >= 38} />;
}

/** Plain-language names for screen readers and messages. */
export function faceName(face: number, locale: 'en' | 'es'): string {
  const es = locale === 'es';
  if (face < 9) return es ? `${face + 1} de círculos` : `${face + 1} of dots`;
  if (face < 18) return es ? `${face - 8} de bambú` : `${face - 8} of bamboo`;
  if (face < 27) return es ? `${face - 17} de caracteres` : `${face - 17} of characters`;
  if (face < 31)
    return (
      es
        ? ['viento este', 'viento sur', 'viento oeste', 'viento norte']
        : ['east wind', 'south wind', 'west wind', 'north wind']
    )[face - 27]!;
  if (face < 34)
    return (
      es
        ? ['dragón rojo', 'dragón verde', 'dragón blanco']
        : ['red dragon', 'green dragon', 'white dragon']
    )[face - 31]!;
  if (face < 38) return es ? `flor ${face - 33}` : `flower ${face - 33}`;
  return es ? `estación ${face - 37}` : `season ${face - 37}`;
}
