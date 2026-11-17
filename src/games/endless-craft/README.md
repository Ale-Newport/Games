# #223 Endless Craft

A drag-and-drop element-crafting sandbox in the style of the viral "infinite" crafting game
(generic name, original look and an original recipe book). The original asks a language model for
every pair; this static version uses a hand-written book, so not every pair makes something.

| File            | Role                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `data.ts`       | The recipe book: 225 elements (emoji, English, Spanish), 377 recipes   |
| `engine.ts`     | Pure rules: workspace chips, combining, discoveries, reachability      |
| `CraftGame.tsx` | Crafting space, drag and drop, list with search and sort, hints, saves |
| `ai-adapter.ts` | Environment (300 combinations per episode) and three agents            |

## Specification

### Ruleset (`endless-craft-book-1`)

- You start with Water, Fire, Wind and Earth (as chips on the space and in the list).
- Dropping a chip onto another (centres within 46 px) combines the two elements: if the recipe
  book has the pair (in either order), both chips become the result where the target chip was; a
  result not in your list is a discovery and joins it. Otherwise nothing happens.
- Every one of the 225 elements is reachable from the four basics (checked by a test); the book
  has 377 recipes, with alternatives for many elements.
- Chips can be moved, duplicated (double click or D), removed (right click, Delete, or dragging
  back onto the list) and cleared. A hint names one ingredient of an element you can already make.
- Progress (discoveries, chips, pairs tried) is saved automatically (`schema 1`). Leaving records
  the session if you discovered something (score = discoveries).

### States and actions

`Craft`: discoveries in order, chips (id, element, position as fractions of the space), next id,
pairs tried, the last combination (pair, result, whether new). The AI environment's actions are
untried pairs of discovered elements (`a+b`); an episode ends when everything is found or after
300 combinations; the return is the number of elements discovered.

### Agents

Random (any untried pair), Curious (tries everything with its newest discovery first) and Recipe
book (knows the book — an upper bound that finds all 225 within the budget).

### Controls

Mouse or touch: drag from the list or tap to place; drag chips; drop one on another. Keyboard:
Tab between items; Enter on a list item places it; Enter on a chip selects it and Enter on a
second combines them; D duplicates; Delete removes. Search box and sort by discovery order or
name.

### Graphics and audio

A dotted crafting space with emoji chips, a selection ring, a pop on new results (none with
reduced motion), a status toast, and a sidebar list. Soft sounds for placing, making something,
a new discovery and nothing happening. All names in English and Spanish (search matches either).

### Simplifications

A fixed recipe book instead of a language model: about 380 working pairs rather than an
unbounded space, so most random pairs do nothing (the hint helps). No global "first discovery"
across players.

### Achievements

first, found-25, found-50, found-100, found-150, dragon, ai, all.

### Tests

`tests/engine.test.ts` (book consistency and reachability, order-free combining, discoveries,
repeats, unknown pairs, chip operations, validation, the recipe-book agent finding everything,
adapter contract), `tests/ui.test.tsx`, `tests/e2e/games/endless-craft.spec.ts`.
