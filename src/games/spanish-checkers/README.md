# #014 Spanish Checkers

Damas españolas. Full spec: [GAME_SPEC.md](GAME_SPEC.md). Built on the shared draughts family
(`src/games/shared/draughts/`, see #012's README) with the `SPANISH` variant (other square parity,
flying kings, forward-only men, quantity-then-quality capture law). This module sets colors (White
moves first), levels, strings, art and achievements (`capturedAKing` replay in `rules.ts`).
