/** Original throw icons (viewBox 64 × 64): rock, paper, scissors, lizard and wizard. */
export type ThrowIcon = 'rock' | 'paper' | 'scissors' | 'lizard' | 'wizard';

export function ThrowArt({ icon }: { icon: ThrowIcon }) {
  switch (icon) {
    case 'rock':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path
            d="M14 40 L18 22 L32 14 L46 18 L54 32 L50 48 L32 54 L18 50 Z"
            fill="#8a8f9c"
            stroke="#4a4f5c"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M24 28 L32 24 M38 34 L44 38 M26 42 L30 44"
            stroke="#5d6270"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'paper':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path
            d="M16 8 H40 L50 18 V56 H16 Z"
            fill="#f7f4ea"
            stroke="#6b6658"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M40 8 V18 H50"
            fill="none"
            stroke="#6b6658"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M22 28 H44 M22 36 H44 M22 44 H36"
            stroke="#b5ae99"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'scissors':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path
            d="M24 38 L52 10 M40 38 L12 10"
            stroke="#9aa3b5"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="46" r="8" fill="none" stroke="#d64545" strokeWidth="5" />
          <circle cx="44" cy="46" r="8" fill="none" stroke="#d64545" strokeWidth="5" />
        </svg>
      );
    case 'lizard':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path
            d="M10 44 C18 34 26 40 34 32 C40 26 46 24 52 26 C56 27 58 30 56 33 C52 36 46 34 42 38 C36 44 26 48 18 50 C14 51 8 50 10 44 Z"
            fill="#3fa35b"
            stroke="#24683a"
            strokeWidth="2.5"
          />
          <path
            d="M26 42 L22 52 M36 36 L40 46 M30 38 L26 30 M42 30 L44 22"
            stroke="#24683a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="51" cy="29" r="1.8" fill="#1b1b22" />
        </svg>
      );
    case 'wizard':
      return (
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path
            d="M32 6 L46 44 H18 Z"
            fill="#5b3fb5"
            stroke="#382578"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M10 46 Q32 54 54 46 Q32 40 10 46 Z"
            fill="#5b3fb5"
            stroke="#382578"
            strokeWidth="3"
          />
          <path
            d="M30 22 l2 -5 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 Z M38 34 l1 -3 1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 Z"
            fill="#f6d860"
          />
        </svg>
      );
  }
}
