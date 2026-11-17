# #224 Password Rules

An escalating password puzzle in the style of the viral "password game" (generic name, original
wording, sponsors, CAPTCHA art and rule set): every rule you satisfy reveals another, until the
password satisfies all 28 at once.

| File               | Role                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `rules.ts`         | Pure rules, rich-text password model, reveal logic, fire and Paul events   |
| `elements.ts`      | Periodic table symbols and atomic numbers                                  |
| `solver.ts`        | Constructive solver (proves deals solvable; drives the AI agent)           |
| `RichEditor.tsx`   | Contenteditable field with per-character bold, italic, font and size       |
| `PasswordGame.tsx` | Toolbar, emoji buttons, rule cards (captcha, sponsors, silhouette, colour) |
| `ai-adapter.ts`    | Environment with a cursor and editing actions; the solver agent            |

## Specification

### Ruleset (`password-rules-28`)

Rules appear one at a time: when every shown rule passes, the next is revealed (newest first;
broken rules sort to the top). The rules, in order:

1. at least 5 characters · 2. a number · 3. an uppercase letter · 4. a special character
   (anything but letters, digits and spaces) · 5. the digits add up to 25 · 6. a month (English or
   Spanish) · 7. a Roman numeral · 8. a sponsor (Zorbo, Quixa or Blimpo — invented brands) · 9. the Roman numerals (maximal runs of IVXLCDM) multiply to 35 · 10. this CAPTCHA (5
   characters, refreshable) · 11. a two-letter periodic-table symbol (case-sensitive) · 12. the
   current moon phase emoji (one of eight, computed from the date) · 13. the name of the country
   shown as a silhouette (English or Spanish, accents ignored) · 14. a leap year (any number in the
   password) · 15. Paul 🥚 · 16. element symbols (read left to right, two-letter first) whose
   atomic numbers add up to 200 · 17. every vowel bold · 18. no fire · 19. at least three 💪 · 20. an affirmation (I am loved / worthy / enough, or Spanish equivalents) · 21. at least one 🐛
   · 22. the password's length as a number · 23. a prime length · 24. the shown colour in hex
   (refreshable) · 25. at least 30 % of letters in the Cursive font · 26. every digit's font size
   equals its square · 27. at least twice as many italic characters as bold · 28. the current time
   (HH:MM, 24-hour, local).

Events:

- **Paul.** From rule 15 Paul must be in the password; once he is, removing him loses the game.
  When rule 21 appears he hatches (🥚 → 🐔) and eats one 🐛 every 20 s; with no bug at feeding
  time he starves, and more than six bugs make him sick — both lose.
- **Fire.** When rule 18 appears, a random character (never Paul) turns into 🔥; every second
  the fire spreads to a neighbour. Fire reaching Paul loses the game. Deleting every 🔥 puts it out
  for good.
- When all 28 pass, you are asked to confirm: retype the password exactly to win.

Simplifications: the original's video, chess-puzzle and similar rules that need online data are
replaced by offline ones (silhouette, captcha, colour); "Wingdings" is replaced by a generic
Cursive font.

### Rich text

Each character has bold, italic, font (Sans, Serif, Mono, Cursive) and size (0, 1, 4, 9, 12, 16,
25, 28, 32, 36, 42, 49, 64, 81 px). Select text and use the toolbar or Ctrl+B / Ctrl+I; typed
characters take the style of the character before them; paste inserts plain text; Enter is
ignored. Emoji buttons insert 🥚 🐛 💪 and the eight moon phases at the caret.

### Solvability

`solver.ts` builds a password meeting every rule for a deal (with the CAPTCHA and colour
refreshed as a player would when their digits are too large). Tests run it through the fire and
the hatching to the final retype on most deals; the AI agent wins the environment's episodes.

### Scoring and saves

A win records the time; a loss records the rules met. Progress auto-saves (`schema 1`).

### AI environment

A cursor-based editor: type a character at the cursor, backspace, move, format the character
before the cursor, tick a second, refresh the CAPTCHA or colour, confirm. Reward: rules met plus one
for winning; 2,000 actions per episode with a fixed clock. Agents: random and the constructive
solver.

### Graphics and audio

A large rich-text field with a live length counter, a formatting toolbar, green/red rule cards
with invented sponsor logos, a distorted CAPTCHA (SVG), a Natural Earth country silhouette and a
colour swatch. Sounds for new rules, fire, hatching, eating, the final question, losing and
winning.

### Achievements

rule-10, paul (hatch), fire (put it out), win, fast (win in 15 minutes).

### Tests

`tests/rules.test.ts` (roman numerals, element parsing, moon phases, graphemes, reveal order,
full solutions through every event, fire spread and burning Paul, removal/starving/overfeeding,
the solver agent winning, adapter contract), `tests/ui.test.tsx`,
`tests/e2e/games/password-rules.spec.ts`.
