/** The mind reader: an original hooded seer over a crystal ball whose glow follows its confidence. */
export function Seer({
  confidence,
  mood,
}: {
  confidence: number;
  mood: 'think' | 'sure' | 'happy' | 'sad';
}) {
  const hue = 260 - confidence * 210;
  const mouth =
    mood === 'happy'
      ? 'M88 104 Q100 116 112 104'
      : mood === 'sad'
        ? 'M88 112 Q100 102 112 112'
        : mood === 'sure'
          ? 'M90 107 Q100 112 110 107'
          : 'M92 108 H108';
  return (
    <svg
      viewBox="0 0 200 240"
      role="img"
      aria-hidden="true"
      style={{ width: '100%', height: 'auto' }}
    >
      <defs>
        <radialGradient id="mr-ball" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor={`hsl(${hue}, 90%, 70%)`} />
          <stop offset="1" stopColor={`hsl(${hue}, 80%, 30%)`} />
        </radialGradient>
      </defs>
      {/* Hood and robe */}
      <path
        d="M100 20 C55 25 40 75 45 120 L30 200 H170 L155 120 C160 75 145 25 100 20 Z"
        fill="#3b2a6b"
      />
      <path
        d="M100 32 C70 36 62 70 64 98 C66 125 82 135 100 135 C118 135 134 125 136 98 C138 70 130 36 100 32 Z"
        fill="#1b1430"
      />
      {/* Face */}
      <ellipse cx="100" cy="92" rx="26" ry="30" fill="#f0c8a0" />
      <ellipse cx="90" cy="88" rx="4" ry={mood === 'sure' ? 2 : 4.5} fill="#2a1d3d" />
      <ellipse cx="110" cy="88" rx="4" ry={mood === 'sure' ? 2 : 4.5} fill="#2a1d3d" />
      <path d={mouth} stroke="#7a3b2e" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path
        d="M82 78 Q90 73 97 78 M103 78 Q110 73 118 78"
        stroke="#2a1d3d"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Hands and ball */}
      <ellipse cx="62" cy="182" rx="14" ry="9" fill="#f0c8a0" />
      <ellipse cx="138" cy="182" rx="14" ry="9" fill="#f0c8a0" />
      <circle
        className="glow"
        cx="100"
        cy="178"
        r="44"
        fill={`hsl(${hue}, 90%, 60%)`}
        opacity="0.25"
      />
      <circle cx="100" cy="178" r="34" fill="url(#mr-ball)" />
      <rect x="72" y="206" width="56" height="16" rx="5" fill="#8a6a3a" />
      {/* Stars on the robe */}
      <path
        d="M60 150 l3 6 6 1 -5 4 2 6 -6-3 -6 3 2-6 -5-4 6-1z M140 140 l2 4 4 1 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-1z"
        fill="#ffd23f"
      />
    </svg>
  );
}
