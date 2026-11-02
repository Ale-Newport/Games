# #182 Spike Hop — Game Specification

A precision platformer with an original name, hero and eight single-screen rooms, on the shared
tile physics (`shared/platform/physics.ts`).

## Ruleset (`spike-hop`)

Rooms of 20 × 14 tiles (16 px), at 60 steps a second: first steps (spike pits), a stairway of
ledges over spikes, a chimney climbed by wall jumps, a spike pit too wide to jump without a dash, a
spring to a high ledge, a corridor under ceiling spikes (only short hops fit), a ledge reached by
jump and dash up, and a gauntlet. The hero (10 × 14) accelerates by 0.2 px/step² on the ground and
0.12 in the air to 2 px/step; a jump starts at −5 with gravity 0.2 while rising with the button held
(0.42 otherwise), about 62 px high; a jump still works 5 steps after leaving a ledge. Pressing
into a wall in mid-air caps the fall at 1.2 px/step; jumping there kicks off at 2.4 px/step sideways
and −4.6 up, with sideways control locked for 8 steps. Once per airtime the hero can dash for 10
steps at 4.2 px/step in the held direction (left, right, up, up-left, up-right; facing if none),
without gravity; the dash returns on landing. Springs throw the hero up at −8 (light gravity all
the way up, about 160 px) and return the dash. Touching a spike, or falling out, kills; the hero
reappears at the room's start after half a second. The door clears the room: 1000 points; each
death costs 25; finishing all eight within ten minutes adds 10 points a second left; running out
of time ends the run.

## Players (watch mode and AI Lab)

- `planner`: the rooms hold no chance, so it searches them: a beam search over the next seven moves
  of six steps (run either way, jump either way or straight up, wait, dash five ways), keeping the
  40 best positions (merging those in the same place with the same vertical speed and dash), scored
  by the length of the open path from the hero to the door (spikes counted as walls), height and
  having a dash in hand. Each chosen move is remembered for its six steps.
- `hopper`: runs at the door and jumps at spikes, gaps and walls just ahead; never dashes or kicks
  off walls.

Measured (one run each — the game has no chance): the planner cleared all eight rooms in 22 s
without dying (13 770 points); the hopper cleared two and stood stuck at the foot of the chimney
until the time ran out.

## States and actions

`Hop`: room, hero (position, speed, facing, ground, steps in the air, wall touched, control lock,
dash steps and direction, dash in hand, spring rise), jump and dash held, deaths (in all and in the
room), death and door pauses, time, score, won, the step's events, steps, dashes and wall jumps.
Actions per step: `idle`, `left`, `right`, `jump`, `left-jump`, `right-jump`, `dash`, `left-dash`,
`right-dash`, `up-dash`, `up-left-dash`, `up-right-dash`.

## Saves and AI interface

Leaving a run for the menu saves it to resume. Env `precision-platformer` v`1.0.0`: kind
`real-time` (60 Hz), one seat, the score as return; a 30-minute step limit (the game's own limit is
ten minutes).

## Achievements

| id         | Condition                            |
| ---------- | ------------------------------------ |
| `wall`     | Kick off a wall.                     |
| `dash`     | Clear the dash-gap room.             |
| `win`      | Clear all eight rooms.               |
| `flawless` | Clear all eight rooms without dying. |

## Graphics and audio

A night-blue backdrop; slate walls with lit top and left edges; white spikes on red bases, pointing
up from floors and down from ceilings; yellow-coiled springs with a red pad; a purple door glowing
gold. The hero, a small figure in blue with a lantern that shines yellow while a dash is in hand
and goes dark once spent, leaves blue afterimages when dashing and bursts into sparks on spikes.
Synthesized sounds for jumps, wall jumps, dashes, springs, deaths and doors.

## Testing criteria

Room shapes; running and held versus tapped jumps; wall slides and wall jumps; one dash per
airtime, refilled on landing; springs; spikes, respawn and the death count; doors and the time
limit; the planner clearing all eight rooms and the hopper getting stuck; exact replays. The
contract suite; UI: running into spikes, watch mode clearing rooms. E2E desktop + mobile.
