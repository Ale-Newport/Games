# #218 Disc Soccer

Top-down physics football played with discs (generic name; original look), in the style of the
browser "head-ball" disc games: you are one disc on a red team; teammates and opponents are bots.

| File            | Role                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| `sim.ts`        | Pure 60 Hz physics, kick-off barrier, goals, overtime; the bot brain       |
| `definition.ts` | Arcade shell definition: options, controls, pitch drawing, sounds, strings |
| `Game.tsx`      | `<ArcadeShell def={SOCCER}>` (menu, HUD, pause, touch pad, saves, watch)   |
| `ai-adapter.ts` | Environment (the red star disc) and the striker agent                      |

## Specification

### Ruleset (`disc-soccer-classic`)

- Pitch 720 × 360 units inside an 840 × 440 arena; goals 128 units wide and 34 deep at each end,
  with a round post (radius 8) at each corner of the goal mouth.
- Players are discs of radius 15 (mass 2), the ball radius 10 (mass 1).
- Each step a player accelerates 0.1 (0.07 while holding kick) towards its input direction (eight
  directions, normalised), then its velocity is multiplied by 0.96; the ball's by 0.99.
- Kick: while kick is held, a player whose edge is within 4 units of the ball strikes it with an
  impulse of 5 along the line between centres (once per press). Without kicking, touching the
  ball pushes it by an elastic collision (dribbling).
- Disc–disc, disc–ball and ball–post collisions are elastic with restitution 0.5 (0.6 off posts); the ball bounces off
  the side walls and the end lines outside the goal mouth. Players may run anywhere in the
  arena, around the pitch included.
- A goal is scored when the ball's centre crosses a goal line between the posts. Play stops
  for 2 s, then the conceding team kicks off.
- Kick-off: everyone resets to their formation; until the ball is touched, the non-kicking team is
  held in its own half and outside the centre circle (radius 70).
- A match lasts 3 or 5 minutes, or until a team reaches 3 or 5 goals. If it is level when time runs
  out, overtime is golden goal (next goal wins).

### Modes and levels

- Team size 1 v 1, 2 v 2 or 3 v 3 (your teammates are bots of the chosen level).
- Bot level easy / medium / hard: aim noise of 26 / 12 / 4 units, easy bots also hesitate 30 % of
  the time and kick when only roughly lined up.
- Watch mode lets the striker policy play your disc too.

### Bots

For each team the disc closest to the ball attacks: it runs to the spot behind the (predicted)
ball on the line from the opponent's goal and kicks when the ball lies between it and the goal.
The others defend a spot between the ball and their own goal and clear the ball when it is close.
At an opponent kick-off they hold their formation.

### Scoring and saves

Score = goal difference (recorded with mode `${size}v${size}-${level}`). Achievements: first goal,
win, beat hard, clean sheet, hat-trick, golden goal. Matches in progress are saved by the shell
(`ds` slot) and validated on load.

### Controls

Arrows / WASD (diagonals), Space, Enter, X or Shift to kick; on phones on-screen pad buttons;
P pauses, R restarts.

### Graphics and audio

Canvas pitch with mowing stripes, lines, goals with nets and team-coloured posts; discs in red and
blue with a white ring while kicking and a star on your disc; ball with a short motion trail
(hidden with reduced motion); a "GOAL!" banner. Synthesised kick, bounce, whistle, goal and
win/lose sounds.

### Simplifications

Online multiplayer, custom stadiums and chat of the original-style games are not included (the
platform is static); every other disc is a bot.

### Tests

`tests/sim.test.ts` (acceleration, damping, kick and goal, complete bot matches),
`tests/game.test.ts` (kick-off barrier, arena bounds, controls, results, adapter contract),
`tests/ui.test.tsx` (a full match through the shell), `tests/e2e/games/disc-soccer.spec.ts`.

### AI interface

`arcadeEnv` over the definition: one action per 1/60 s step for the red star disc (`idle`, eight
directions, the same with `k` for kick, or `k` alone), terminal at full time or after 12 minutes;
agent: Striker.
