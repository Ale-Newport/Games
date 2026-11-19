## What and why

<!-- What does this change, and why? Link the issue it closes: "Closes #123". -->

## How it was tested

<!-- Commands you ran and what you checked by hand (desktop and phone width, light/dark theme). -->

- [ ] `npm run lint && npm run typecheck && npm test` pass
- [ ] `npm run test:e2e` passes (or the affected `tests/e2e/games/<id>.spec.ts`)
- [ ] Played the affected game(s) in the browser

## Checklist

- [ ] Rules logic stays in the pure engine; randomness uses the seeded RNG (no `Math.random()` in rules)
- [ ] New user-facing text is localized in English **and** Spanish
- [ ] Works with keyboard, mouse and touch; dark/light themes; reduced motion
- [ ] All new art, sounds, levels and data are original or properly licensed (listed in `docs/asset-licenses.md`)
- [ ] Docs updated (the game's `README.md`, `CHANGELOG.md` under _Unreleased_) where relevant

<!--
All pull requests are reviewed and approved by the maintainer (CODEOWNERS) before they are merged.
By contributing you agree that your contribution is licensed under the MIT License.
-->
