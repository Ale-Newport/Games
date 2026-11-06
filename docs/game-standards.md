# Definition of a Completed Game

A game may be marked **COMPLETE** in `src/data/roadmap.ts` (and registered as playable) only when
every applicable item below is true. "Launches" is not completion.

## Rules and engine

- [ ] `GAME_SPEC.md` documents the exact ruleset variant chosen, and any deliberate deviation.
- [ ] The full ruleset is implemented in a pure engine independent of React/rendering.
- [ ] All legal actions are generated; illegal actions are rejected (throw `IllegalActionError`).
- [ ] All terminal conditions: win, loss, draw (and stalemate/repetition/timeouts where defined).
- [ ] Scoring and settlement match the documented rules.
- [ ] Randomness is seeded and stored in state; no `Math.random()` in rules.

## Content and progression

- [ ] Every mode in the spec works (e.g. vs computer at all difficulties, local multiplayer).
- [ ] Every level/stage/puzzle set in the spec exists and is individually validated
      (automated where feasible). Procedural content has a real generator with
      solvability/playability checks.
- [ ] No victory screen without real completion; no recolored duplicate stages.

## Presentation

- [ ] Polished visuals appropriate to the genre (no placeholder rectangles unless the genre is
      genuinely geometric), animations, original sound effects.
- [ ] Clear turn/state indication, legal-move hints where appropriate, victory/defeat/draw screens.
- [ ] Works in dark and light themes; honors reduced motion; colorblind cues where color matters.
- [ ] Responsive: usable on phone portrait (≈360px wide), tablet and desktop. No overflow, no
      unintended scrolling during play.

## Interaction

- [ ] Keyboard, mouse and touch controls. Focus indicators visible.
- [ ] Restart, undo (where it makes sense), pause/resume for real-time games.
- [ ] Rules/help content via the platform Rules dialog (`Rules` export), English and Spanish.

## Platform integration

- [ ] `manifest.ts` complete and localized; preview art in `assets/preview.svg`.
- [ ] Statistics via `services.recordResult` with meaningful mode keys.
- [ ] Achievements where meaningful, unlocked by real events.
- [ ] Save/resume via `services.saveSlot` with a validator (where sessions can be interrupted).
- [ ] Registered in `src/games/registry.ts` and `src/ai/adapters/registry.ts`.

## AI

- [ ] `ai-adapter.ts` implements `GameEnvironment` over the real engine and exports an `AiBundle`
      with at least one functional baseline agent (random) and the game's computer opponents.
- [ ] Hidden information never appears in another player's observation.
- [ ] Passes `describeAdapterContract` (legal actions, transitions, terminals, serialization,
      deterministic replay, illegal-action rejection, stress playouts).

## Verification

- [ ] Unit tests: rules, legal/illegal actions, initial state, progression, scoring, win/loss/draw,
      save/load, restart, input handling, edge cases, AI adapter.
- [ ] Playwright spec: loads via direct URL, real interactions through to an ending, mobile project.
- [ ] Real play-throughs performed in the browser on desktop and mobile viewport; screenshots
      reviewed; defects fixed.
- [ ] `npm run verify` passes.

## Documentation and commit

- [ ] Game `README.md`; roadmap entry updated (all parts `done`, completion date, known issues);
      `npm run roadmap`; `PROGRESS.md` and `NEXT_STEPS.md` updated.
- [ ] Dedicated commit `feat(games): complete #NNN <Name>`.
