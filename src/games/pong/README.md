# #166 Pong

Full spec: [GAME_SPEC.md](GAME_SPEC.md).

`sim.ts` (the pure 60 Hz simulation: paddles, ball, bounces, angles, points, the computer
opponent, the tracker and follower policies), `definition.ts` (the game for the shared arcade shell:
options, drawing, controls, sounds, results, strings), `Game.tsx`, `ai-adapter.ts`, `HowToPlay.tsx`,
`manifest.ts`, `assets/preview.svg`, `tests/`. The shell, the fixed-step loop wiring and the
real-time AI environment live in `../shared/arcade/`.
