/** Original card faces (viewBox 40 × 40): nine shapes in two colours, eighteen faces in all. */
const COLOURS = ['#d64545', '#2f6fd6'];

function Shape({ k, fill }: { k: number; fill: string }) {
  switch (k) {
    case 0:
      return <circle cx="20" cy="20" r="12" fill={fill} />;
    case 1:
      return <rect x="9" y="9" width="22" height="22" rx="3" fill={fill} />;
    case 2:
      return <path d="M20 7 L33 31 H7 Z" fill={fill} />;
    case 3:
      return (
        <path
          d="M20 6 L24 16 L34 16 L26 23 L29 33 L20 27 L11 33 L14 23 L6 16 L16 16 Z"
          fill={fill}
        />
      );
    case 4:
      return (
        <path
          d="M20 33 C6 23 8 10 15 10 C18 10 20 13 20 15 C20 13 22 10 25 10 C32 10 34 23 20 33 Z"
          fill={fill}
        />
      );
    case 5:
      return <path d="M20 5 L33 20 L20 35 L7 20 Z" fill={fill} />;
    case 6:
      return <path d="M13 8 H27 L34 20 L27 32 H13 L6 20 Z" fill={fill} />;
    case 7:
      return <path d="M26 6 A14 14 0 1 0 26 34 A11 11 0 1 1 26 6 Z" fill={fill} />;
    default:
      return <path d="M16 7 H24 V16 H33 V24 H24 V33 H16 V24 H7 V16 H16 Z" fill={fill} />;
  }
}

export function CardFace({ face }: { face: number }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <Shape k={face % 9} fill={COLOURS[Math.floor(face / 9) % 2]!} />
    </svg>
  );
}

const SHAPES_EN = [
  'circle',
  'square',
  'triangle',
  'star',
  'heart',
  'diamond',
  'hexagon',
  'moon',
  'cross',
];
const SHAPES_ES = [
  'círculo',
  'cuadrado',
  'triángulo',
  'estrella',
  'corazón',
  'rombo',
  'hexágono',
  'luna',
  'cruz',
];

export function faceName(face: number, locale: 'en' | 'es'): string {
  const red = Math.floor(face / 9) % 2 === 0;
  if (locale === 'es') {
    const shape = SHAPES_ES[face % 9]!;
    const fem = ['estrella', 'luna', 'cruz'].includes(shape);
    return `${shape} ${red ? (fem ? 'roja' : 'rojo') : 'azul'}`;
  }
  return `${red ? 'red' : 'blue'} ${SHAPES_EN[face % 9]}`;
}
