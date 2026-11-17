/**
 * Original illustrated "meme" scenes for #216 Caption Battle (no photographs or existing meme
 * images): simple SVG situations that invite a caption. Each scene has bot captions in English and
 * Spanish written for this project.
 */
import type { ReactNode } from 'react';

export interface Scene {
  id: string;
  art: ReactNode;
  captions: { en: string[]; es: string[] };
}

const ink = '#1a1420';
const face = (x: number, y: number, mood: 'worry' | 'smug' | 'shock' | 'calm' | 'sad') => (
  <g
    transform={`translate(${x} ${y})`}
    stroke={ink}
    strokeWidth={3}
    fill="none"
    strokeLinecap="round"
  >
    <circle cx={-10} cy={-4} r={3} fill={ink} />
    <circle cx={10} cy={-4} r={3} fill={ink} />
    {mood === 'worry' && <path d="M-10 14 q10 -8 20 0" />}
    {mood === 'smug' && <path d="M-10 10 q12 10 22 -4" />}
    {mood === 'shock' && <ellipse cx={0} cy={12} rx={6} ry={8} fill={ink} />}
    {mood === 'calm' && <path d="M-8 10 h16" />}
    {mood === 'sad' && <path d="M-10 16 q10 -10 20 0" />}
    {mood === 'worry' && <path d="M-18 -14 l10 4 M18 -14 l-10 4" />}
  </g>
);

export const SCENES: Scene[] = [
  {
    id: 'two-buttons',
    art: (
      <>
        <rect width="400" height="300" fill="#ffe7a8" />
        <rect
          x="60"
          y="40"
          width="280"
          height="90"
          rx="12"
          fill="#5b6475"
          stroke={ink}
          strokeWidth={4}
        />
        <circle cx="140" cy="85" r="26" fill="#e84a5f" stroke={ink} strokeWidth={4} />
        <circle cx="260" cy="85" r="26" fill="#2aa198" stroke={ink} strokeWidth={4} />
        <circle cx="200" cy="215" r="60" fill="#f6c28b" stroke={ink} strokeWidth={4} />
        {face(200, 215, 'worry')}
        <path
          d="M150 170 q-10 -20 -2 -40 M250 170 q10 -20 2 -40"
          stroke={ink}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="232" cy="190" r="5" fill="#7fd3ff" />
      </>
    ),
    captions: {
      en: [
        'Save the money / Buy the snacks',
        'Reply now / Reply in three weeks',
        'Go to bed / One more episode',
        'Fix the bug / Rename the variable',
      ],
      es: [
        'Ahorrar / Comprar más chuches',
        'Contestar ya / Contestar en tres semanas',
        'Dormir / Un capítulo más',
        'Arreglar el error / Cambiar el nombre de la variable',
      ],
    },
  },
  {
    id: 'calm-fire',
    art: (
      <>
        <rect width="400" height="300" fill="#ffd27f" />
        <path
          d="M20 300 q20 -90 50 -40 q10 -80 50 -30 q20 -70 50 0 M260 300 q20 -100 50 -40 q20 -60 60 10"
          fill="#ff6b35"
          stroke={ink}
          strokeWidth={4}
        />
        <rect
          x="150"
          y="150"
          width="110"
          height="120"
          rx="20"
          fill="#c9a26b"
          stroke={ink}
          strokeWidth={4}
        />
        <circle cx="205" cy="125" r="45" fill="#e8c39e" stroke={ink} strokeWidth={4} />
        {face(205, 125, 'calm')}
        <rect
          x="235"
          y="175"
          width="26"
          height="30"
          rx="4"
          fill="#fff"
          stroke={ink}
          strokeWidth={3}
        />
      </>
    ),
    captions: {
      en: [
        'Me during the group project',
        'The inbox: 4,812 unread',
        'Everything is under control',
        'Monday at 9:01',
      ],
      es: [
        'Yo en el trabajo en grupo',
        'La bandeja de entrada: 4812 sin leer',
        'Todo está bajo control',
        'Lunes a las 9:01',
      ],
    },
  },
  {
    id: 'snail-race',
    art: (
      <>
        <rect width="400" height="300" fill="#bfe8a8" />
        <path d="M0 230 h400" stroke={ink} strokeWidth={4} />
        <rect x="330" y="120" width="8" height="110" fill={ink} />
        <path d="M338 120 h40 v30 h-40" fill="#fff" stroke={ink} strokeWidth={3} />
        <ellipse cx="120" cy="215" rx="60" ry="14" fill="#9e8ab4" stroke={ink} strokeWidth={4} />
        <circle cx="120" cy="180" r="34" fill="#d98f5b" stroke={ink} strokeWidth={4} />
        <path d="M120 180 m-18 0 a18 18 0 1 0 18 -18" fill="none" stroke={ink} strokeWidth={3} />
        <path d="M170 210 l14 -30 M180 210 l20 -26" stroke={ink} strokeWidth={4} />
        <circle cx="184" cy="178" r="5" fill={ink} />
        <path d="M30 200 h30 M20 215 h30" stroke={ink} strokeWidth={3} strokeDasharray="6 6" />
      </>
    ),
    captions: {
      en: [
        'My download at 99%',
        'Me running late but confident',
        'The queue at the post office',
        'My motivation on a Sunday',
      ],
      es: [
        'Mi descarga al 99 %',
        'Yo llegando tarde pero seguro',
        'La cola de correos',
        'Mi motivación un domingo',
      ],
    },
  },
  {
    id: 'cat-screen',
    art: (
      <>
        <rect width="400" height="300" fill="#2b2d42" />
        <rect
          x="70"
          y="40"
          width="260"
          height="160"
          rx="10"
          fill="#8ecae6"
          stroke={ink}
          strokeWidth={5}
        />
        <path
          d="M100 160 l40 -50 l30 30 l40 -60 l50 80"
          stroke="#e63946"
          strokeWidth={6}
          fill="none"
        />
        <ellipse cx="200" cy="270" rx="70" ry="40" fill="#f4a261" stroke={ink} strokeWidth={4} />
        <path
          d="M150 245 l-6 -40 l26 22 M250 245 l6 -40 l-26 22"
          fill="#f4a261"
          stroke={ink}
          strokeWidth={4}
        />
        {face(200, 262, 'shock')}
      </>
    ),
    captions: {
      en: [
        'When you check your bank app after the weekend',
        'The stock I bought yesterday',
        'Me reading my own code from last year',
        'When the group chat has 200 new messages',
      ],
      es: [
        'Cuando miras el banco después del finde',
        'Las acciones que compré ayer',
        'Yo leyendo mi código del año pasado',
        'Cuando el grupo tiene 200 mensajes nuevos',
      ],
    },
  },
  {
    id: 'robot-plant',
    art: (
      <>
        <rect width="400" height="300" fill="#d7f0ff" />
        <rect
          x="110"
          y="90"
          width="110"
          height="130"
          rx="14"
          fill="#b0bec5"
          stroke={ink}
          strokeWidth={4}
        />
        <rect
          x="125"
          y="40"
          width="80"
          height="60"
          rx="10"
          fill="#cfd8dc"
          stroke={ink}
          strokeWidth={4}
        />
        <circle cx="150" cy="70" r="7" fill="#00e5ff" stroke={ink} strokeWidth={2} />
        <circle cx="180" cy="70" r="7" fill="#00e5ff" stroke={ink} strokeWidth={2} />
        <path d="M220 140 h50 v-20" stroke={ink} strokeWidth={6} fill="none" />
        <path d="M262 90 l10 30 l10 -30 z" fill="#5c6bc0" stroke={ink} strokeWidth={3} />
        <rect x="270" y="210" width="50" height="40" fill="#bc6c25" stroke={ink} strokeWidth={4} />
        <path d="M295 210 q-15 -30 0 -50 q15 20 0 50" fill="#52b788" stroke={ink} strokeWidth={3} />
      </>
    ),
    captions: {
      en: [
        'Day 1 of being a responsible adult',
        'The AI trying to understand feelings',
        'Me watering the plant I already watered',
        'New hobby: day two',
      ],
      es: [
        'Día 1 siendo un adulto responsable',
        'La IA intentando entender los sentimientos',
        'Yo regando la planta que ya regué',
        'Nuevo hobby: día dos',
      ],
    },
  },
  {
    id: 'ghost-doorbell',
    art: (
      <>
        <rect width="400" height="300" fill="#3a3355" />
        <rect x="220" y="60" width="120" height="220" fill="#8d6e63" stroke={ink} strokeWidth={5} />
        <circle cx="320" cy="170" r="6" fill="#ffd166" />
        <path
          d="M90 260 v-120 a50 50 0 0 1 100 0 v120 l-16 -14 l-17 14 l-17 -14 l-17 14 l-17 -14 z"
          fill="#f8f9fa"
          stroke={ink}
          strokeWidth={4}
        />
        {face(140, 150, 'smug')}
        <rect
          x="200"
          y="140"
          width="14"
          height="22"
          rx="3"
          fill="#ffd166"
          stroke={ink}
          strokeWidth={2}
        />
      </>
    ),
    captions: {
      en: [
        'When you show up to the party nobody invited you to',
        'Me after ignoring messages for a month',
        'Delivery says “left at the door”',
        'Trick or treat? It is March',
      ],
      es: [
        'Cuando vas a la fiesta a la que nadie te invitó',
        'Yo tras ignorar mensajes un mes',
        'El repartidor: “dejado en la puerta”',
        '¿Truco o trato? Es marzo',
      ],
    },
  },
  {
    id: 'penguin-ice',
    art: (
      <>
        <rect width="400" height="300" fill="#a8dadc" />
        <path d="M0 220 q100 -10 200 0 t200 0 v80 h-400z" fill="#457b9d" />
        <path d="M120 230 l60 -12 l40 12 l-30 10 z" fill="#f1faee" stroke={ink} strokeWidth={3} />
        <ellipse cx="170" cy="190" rx="22" ry="34" fill="#1d3557" stroke={ink} strokeWidth={3} />
        <ellipse cx="170" cy="198" rx="14" ry="24" fill="#f1faee" />
        <circle cx="170" cy="150" r="16" fill="#1d3557" stroke={ink} strokeWidth={3} />
        <path d="M184 150 l12 4 l-12 4" fill="#f4a261" />
        <path d="M260 120 q40 -40 80 0" stroke="#f1faee" strokeWidth={6} fill="none" />
      </>
    ),
    captions: {
      en: [
        'My personal space on the morning train',
        'Me after saying “I’ll just check one email”',
        'The last slice of pizza, alone and proud',
        'Working from home: the commute',
      ],
      es: [
        'Mi espacio personal en el tren de la mañana',
        'Yo tras decir “solo miro un correo”',
        'La última porción de pizza, sola y orgullosa',
        'Teletrabajo: el trayecto',
      ],
    },
  },
  {
    id: 'dog-chef',
    art: (
      <>
        <rect width="400" height="300" fill="#fff1e6" />
        <rect x="40" y="200" width="320" height="100" fill="#d4a373" stroke={ink} strokeWidth={4} />
        <circle cx="200" cy="140" r="56" fill="#ddb892" stroke={ink} strokeWidth={4} />
        <path
          d="M150 110 q-30 30 -10 60 M250 110 q30 30 10 60"
          fill="#7f5539"
          stroke={ink}
          strokeWidth={4}
        />
        <path d="M160 90 q40 -60 80 0 z" fill="#fff" stroke={ink} strokeWidth={4} />
        {face(200, 150, 'smug')}
        <ellipse cx="200" cy="235" rx="70" ry="18" fill="#8d99ae" stroke={ink} strokeWidth={4} />
        <path d="M160 225 q40 -30 80 0" fill="#e76f51" stroke={ink} strokeWidth={3} />
      </>
    ),
    captions: {
      en: [
        'Following the recipe exactly (I skipped six steps)',
        'Me after one cooking video',
        'Dinner is served: cereal',
        'Chef’s special: whatever was in the fridge',
      ],
      es: [
        'Siguiendo la receta al pie de la letra (me salté seis pasos)',
        'Yo después de ver un vídeo de cocina',
        'La cena está servida: cereales',
        'Especialidad del chef: lo que había en la nevera',
      ],
    },
  },
];
