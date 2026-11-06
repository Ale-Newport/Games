import { useMemo, useState } from 'react';
import type { AgentPreset } from '../../../ai/protocols/bundle';
import type { GameEnvironment } from '../../../ai/protocols/types';
import { moveCursor } from '../../../core/game-engine/grid';
import type { GameProps } from '../../../core/game-engine/types';
import type { Dictionary, Locale } from '../../../core/i18n';
import { arrowDirection, useKeyboard } from '../../../core/input/keyboard';
import {
  TwoPlayerGame,
  type BoardProps,
  type RoundEndEvent,
  type TwoPlayerGameDefinition,
} from '../two-player/TwoPlayerGame';
import type { ShellSounds } from '../two-player/sounds';
import type { MnkRules, MnkState } from './engine';
import { MNK_STRINGS } from './i18n';
import { toMatchConfig, type MnkMatchConfig } from './match';
import { MnkBoard } from './MnkBoard';

export type { RoundEndEvent } from '../two-player/TwoPlayerGame';

/** Everything that distinguishes one m,n,k game from another. */
export interface MnkGameDefinition {
  match: MnkMatchConfig;
  env: GameEnvironment<MnkState, number>;
  agents: readonly AgentPreset<MnkState, number>[];
  /** Game strings (title, subtitle, difficulty names/hints, board label). */
  strings: Record<Locale, Dictionary>;
  sounds?: Partial<ShellSounds>;
  /** Digit keys mapped to cells (e.g. numeric-keypad layout on 3×3). */
  digitKeys?: Readonly<Record<string, number>>;
  hintAgent: string;
  unbeatableDifficulty?: string;
  onRoundEnd?: (event: RoundEndEvent<MnkState>) => void;
}

function createBoard(rules: MnkRules, digitKeys?: Readonly<Record<string, number>>) {
  const center = Math.floor(rules.rows / 2) * rules.cols + Math.floor(rules.cols / 2);
  return function MnkBoardAdapter({
    state,
    interactive,
    hint,
    animate,
    t,
    onAction,
  }: BoardProps<MnkState, number>) {
    const [cursor, setCursor] = useState(center);
    const [focusToken, setFocusToken] = useState(0);
    useKeyboard((e) => {
      const dir = arrowDirection(e.key);
      if (dir) {
        setCursor((c) => moveCursor(c, dir, rules));
        setFocusToken((n) => n + 1);
        return true;
      }
      const digitCell = digitKeys?.[e.key];
      if (digitCell !== undefined) {
        setCursor(digitCell);
        onAction(digitCell);
        return true;
      }
      if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        onAction(cursor);
        return true;
      }
      return false;
    });
    const result = state.result;
    const lastMove = state.history.length ? state.history[state.history.length - 1]! : null;
    // The line's owner: the winner normally, the loser in misère play.
    const lineOwner =
      result?.kind === 'win'
        ? result.reason === 'misere-line'
          ? 1 - result.winner
          : result.winner
        : null;
    return (
      <MnkBoard
        rows={rules.rows}
        cols={rules.cols}
        board={state.board}
        winLine={result?.kind === 'win' ? result.line : null}
        winMark={lineOwner === null ? undefined : lineOwner === 0 ? 1 : 2}
        lastMove={lastMove}
        cursor={cursor}
        focusToken={focusToken}
        hint={hint}
        ghost={interactive ? (state.toMove === 0 ? 1 : 2) : null}
        animate={animate}
        label={t('board.label')}
        cellLabel={(i, c) =>
          t(c === 0 ? 'cell.empty' : c === 1 ? 'cell.x' : 'cell.o', {
            row: Math.floor(i / rules.cols) + 1,
            col: (i % rules.cols) + 1,
          })
        }
        onCell={onAction}
        onFocusCell={setCursor}
      />
    );
  };
}

const definitions = new WeakMap<MnkGameDefinition, TwoPlayerGameDefinition<MnkState, number>>();

export function toTwoPlayerDefinition(
  def: MnkGameDefinition,
): TwoPlayerGameDefinition<MnkState, number> {
  let converted = definitions.get(def);
  if (!converted) {
    const { rules } = def.match;
    converted = {
      match: toMatchConfig(def.match),
      env: def.env,
      agents: def.agents,
      strings: {
        en: { ...MNK_STRINGS.en, ...def.strings.en },
        es: { ...MNK_STRINGS.es, ...def.strings.es },
      },
      Board: createBoard(rules, def.digitKeys),
      badge: `${rules.rows}×${rules.cols}`,
      hintAgent: def.hintAgent,
      unbeatableDifficulty: def.unbeatableDifficulty,
      sounds: def.sounds,
      onRoundEnd: def.onRoundEnd,
      describeAction: (_before, cell, after, t) =>
        t('announce.move', {
          mark: after.board[cell] === 1 ? 'X' : 'O',
          row: Math.floor(cell / rules.cols) + 1,
          col: (cell % rules.cols) + 1,
        }),
    };
    definitions.set(def, converted);
  }
  return converted;
}

export function MnkGame({ def, services }: { def: MnkGameDefinition } & GameProps) {
  const converted = useMemo(() => toTwoPlayerDefinition(def), [def]);
  return <TwoPlayerGame def={converted} services={services} />;
}
