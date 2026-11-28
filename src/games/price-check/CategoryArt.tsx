/** Original illustrations for items without a freely licensed photo, one per category. */
import type { ReactNode } from 'react';
import type { Category } from './engine';

const ART: Record<Category, ReactNode> = {
  games: (
    <>
      <rect x="22" y="14" width="76" height="92" rx="6" fill="#7c5cff" />
      <rect x="30" y="22" width="60" height="44" rx="3" fill="#1b2550" />
      <path d="M44 52l10-14 8 10 6-6 10 10z" fill="#3ddc84" />
      <circle cx="74" cy="34" r="5" fill="#ffd23f" />
      <rect x="34" y="78" width="52" height="8" rx="2" fill="#e9f0ff" />
      <path d="M30 106v-8h60v8" fill="#5a3fd6" />
    </>
  ),
  consoles: (
    <>
      <path
        d="M18 54q0-14 14-14h56q14 0 14 14l6 30q2 14-10 16-8 1-14-8l-6-8H44l-6 8q-6 9-14 8-12-2-10-16z"
        fill="#4a6bd8"
      />
      <path d="M36 58h6v-6h6v6h6v6h-6v6h-6v-6h-6z" fill="#e9f0ff" />
      <circle cx="78" cy="56" r="5" fill="#ff5d73" />
      <circle cx="88" cy="66" r="5" fill="#3ddc84" />
      <circle cx="68" cy="66" r="5" fill="#ffd23f" />
    </>
  ),
  tech: (
    <>
      <rect x="14" y="20" width="92" height="62" rx="5" fill="#2b3f86" />
      <rect x="20" y="26" width="80" height="50" rx="2" fill="#0b1020" />
      <path d="M26 62l14-12 10 8 16-18 18 22z" fill="#26c6da" opacity=".8" />
      <path d="M50 82h20l4 14H46z" fill="#5a6aa8" />
      <rect x="36" y="96" width="48" height="6" rx="2" fill="#7f8cc4" />
    </>
  ),
  gadgets: (
    <>
      <rect x="16" y="36" width="88" height="58" rx="8" fill="#334155" />
      <path d="M42 36l6-10h24l6 10z" fill="#475569" />
      <circle cx="60" cy="64" r="20" fill="#0b1020" stroke="#94a3b8" stroke-width="5" />
      <circle cx="60" cy="64" r="9" fill="#26c6da" opacity=".7" />
      <circle cx="54" cy="58" r="3" fill="#e9f0ff" />
      <rect x="86" y="42" width="10" height="6" rx="2" fill="#ff9d3d" />
    </>
  ),
  art: (
    <>
      <rect x="12" y="16" width="96" height="88" rx="3" fill="#b7791f" />
      <rect x="22" y="26" width="76" height="68" fill="#1e3a5f" />
      <circle cx="78" cy="42" r="8" fill="#ffd23f" />
      <path d="M22 94l22-30 16 18 12-14 26 26z" fill="#2f9e44" />
      <path d="M22 94l18-18 12 18z" fill="#14532d" />
    </>
  ),
  vehicles: (
    <>
      <path d="M8 66q0-8 10-8h60l18-22h10l-8 22h12q10 0 10 8t-10 8H18Q8 74 8 66z" fill="#e9f0ff" />
      <path d="M46 58l-14-24h10l26 24z M50 74l-10 22h10l22-22z" fill="#94a3b8" />
      <path d="M24 62h6v4h-6zm10 0h6v4h-6zm10 0h6v4h-6zm10 0h6v4h-6z" fill="#4a6bd8" />
    </>
  ),
  software: (
    <>
      <rect
        x="14"
        y="18"
        width="92"
        height="76"
        rx="6"
        fill="#1b2550"
        stroke="#7c5cff"
        stroke-width="4"
      />
      <rect x="14" y="18" width="92" height="14" rx="6" fill="#7c5cff" />
      <circle cx="24" cy="25" r="3" fill="#ff5d73" />
      <circle cx="34" cy="25" r="3" fill="#ffd23f" />
      <circle cx="44" cy="25" r="3" fill="#3ddc84" />
      <path
        d="M26 46h30M26 56h44M26 66h24M26 76h36"
        stroke="#26c6da"
        stroke-width="5"
        stroke-linecap="round"
      />
      <path d="M78 64l18 12-8 2 6 10-5 3-6-10-6 6z" fill="#e9f0ff" />
    </>
  ),
  books: (
    <>
      <path d="M60 30q-18-10-44-8v70q26-2 44 8z" fill="#ff8a3d" />
      <path d="M60 30q18-10 44-8v70q-26-2-44 8z" fill="#ff5d73" />
      <path d="M60 30v70" stroke="#7c2d12" stroke-width="3" />
      <path
        d="M24 38q14-1 28 4M24 48q14-1 28 4M24 58q14-1 28 4M68 42q14-5 28-4M68 52q14-5 28-4"
        stroke="#fff3e6"
        stroke-width="3"
      />
    </>
  ),
};

export function CategoryArt({ category, label }: { category: Category; label: string }) {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={label}>
      {ART[category]}
    </svg>
  );
}
