# Asset Provenance and Licenses

All game art and sounds are original to this project unless listed below. No third-party game
sprites, music, logos or level data are used.

## Original assets

| Asset                      | Location                                                 | Provenance                                                         |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Game preview illustrations | `src/games/*/assets/preview.svg`                         | Hand-authored SVG for this project                                 |
| Board/piece graphics       | Inline SVG/CSS/Canvas in each game module                | Original, generated in code                                        |
| Chess piece set            | `src/games/shared/chess/ChessPieces.tsx`                 | Original silhouettes drawn for this project (no third-party set)   |
| Sound effects              | `src/core/audio/audio-engine.ts`, `src/games/*/audio.ts` | Synthesized at runtime with the Web Audio API from parameter specs |
| Favicon / logo             | `public/favicon.svg`                                     | Original                                                           |

## Third-party (bundled, not hotlinked)

| Package                                                      | Use                         | License                   |
| ------------------------------------------------------------ | --------------------------- | ------------------------- |
| `@fontsource-variable/inter` (Inter, Rasmus Andersson)       | Body font                   | SIL Open Font License 1.1 |
| `@fontsource-variable/outfit` (Outfit, On Brand Investments) | Display font                | SIL Open Font License 1.1 |
| `lucide-react`                                               | UI icons (not game sprites) | ISC                       |
| `react`, `react-dom`                                         | UI runtime                  | MIT                       |

## Word lists and data

None yet. The five-letter word game (#120) will need a word list with a compatible license;
record its source and license here before use.
