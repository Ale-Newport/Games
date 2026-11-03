# #192 Star Duel — Game Specification

A two-ship duel around a star, in the spirit of the earliest computer games, with an original name
and look.

## Ruleset (`star-duel`)

A 320 × 240 view that wraps at the edges, at 60 steps a second, with a star of radius 10 in the
middle. The star pulls each ship by 120 / r² px/step² (r at least 20). A ship turns 0.07 rad a step,
its engine adds 0.045 px/step² along its nose, and its speed is capped at 3. It fires a torpedo on a
fresh press (18 steps' reload, four in flight at most) at 3.2 px/step plus its own speed, flying
straight for 120 steps (torpedoes vanish in the star; a ship's own torpedo cannot hit it for its
first 8 steps). Hyperspace (three jumps a round) hides the ship for 45 steps, then brings it back at
a random spot away from the star — or, one time in four, destroys it. A ship that touches the star,
is hit by a torpedo or rams the other ship is destroyed; if one ship survives, it scores a kill
(500 points for the player), and after two seconds both start again from opposite corners, each
nudged at random. The first to five kills wins the match. The player also scores a point for each
second survived.

## Players (watch mode and AI Lab)

The computer flies a duellist. For the player's ship:

- `duellist`: if close to the star or falling inwards fast, burns outwards and a little sideways;
  if a torpedo will pass within reach in the next half second, burns across its path; otherwise
  turns to where the rival will be when a torpedo gets there (three rounds of refining) and fires
  when lined up within 0.12 rad, burning gently if it has almost stopped.
- `gunner`: turns towards the rival's current position and fires; burns only when the star is very
  close.

Measured (12 matches each against the duellist): duellist won 5 (41 kills to 50); gunner none (16
kills to 60); doing nothing loses 0–5 in about 16 s. Before the starts were nudged at random, two
duellists from mirror-image corners shot each other at the same instant every round.

## States and actions

`Duel`: generator, ships (position, speed, angle, alive, reload, hyperspace time and jumps used,
engine firing, kills), torpedoes (position, speed, life, owner), fire held per ship, round pause and
last kill, score, round, the step's events, steps. Actions: `idle`, `left`, `right`, `thrust`,
`thrust-left`, `thrust-right`, `fire`, `hyper`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `spacewar` v`1.0.0`: kind `real-time` (60 Hz),
one seat (the rival is part of the world), the score as return; a 30-minute step limit.

## Achievements

| id         | Condition                         |
| ---------- | --------------------------------- |
| `kill`     | Destroy the rival ship.           |
| `star`     | See the rival fall into the star. |
| `match`    | Win a duel.                       |
| `flawless` | Win a duel five to nil.           |

## Graphics and audio

A black sky of fixed stars, a yellow star with a flickering halo, the player's ship as a slim cyan
arrow and the rival's as a broad amber wedge (outlines), orange engine flames, torpedoes in their
owner's colour, debris on a kill, the kill count shown between rounds. Synthesized sounds for the
engine, torpedoes, hyperspace, kills and losses.

## Testing criteria

Gravity and wrapping; turning and thrust; torpedoes (one per press, four at most, hits); the star;
hyperspace (back or lost, three jumps); kills, rounds and the match; the duellist outscoring the
gunner and an idle ship losing; exact replays. The contract suite; UI: a hyperspace jump and the end
of a duel; watch mode. E2E desktop + mobile.
