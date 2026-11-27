import type { GameManifest } from '../../core/game-engine/types';
import preview from './assets/preview.svg?url';
import { RULES_VERSION, RULESET_ID } from './rules-meta';

export const manifest: GameManifest = {
  id: 'graph-forecast',
  number: 231,
  title: { en: 'Graph Forecast', es: 'Pronostica la gráfica' },
  tagline: {
    en: 'A real statistic with its last years hidden: draw how the line goes on.',
    es: 'Una estadística real con sus últimos años ocultos: dibuja cómo sigue la línea.',
  },
  description: {
    en: 'The graph-extrapolation guessing game: 7,600 real World Bank time series (GDP, population, life expectancy, emissions, internet use and more for every country and region), each shown with its end hidden. Draw your forecast freehand with mouse, finger or keyboard, watch the real line reveal itself, and see whether you out-predicted the computer forecaster. Daily five-graph challenge with streaks and a share line, endless runs by difficulty and topic.',
    es: 'El juego de adivinar cómo sigue una gráfica: 7.600 series temporales reales del Banco Mundial (PIB, población, esperanza de vida, emisiones, uso de internet y más para cada país y región), cada una con el final oculto. Dibuja tu pronóstico a mano alzada con ratón, dedo o teclado, mira cómo aparece la línea real y comprueba si superaste al pronosticador del ordenador. Reto diario de cinco gráficas con rachas y resultado para compartir, y partidas sin fin por dificultad y tema.',
  },
  category: 'estimation',
  genre: { en: 'Data estimation', es: 'Estimación con datos' },
  players: { min: 1, max: 1 },
  vsComputer: false,
  complexity: 2,
  sessionMinutes: 5,
  inputs: ['keyboard', 'mouse', 'touch'],
  preview,
  version: RULES_VERSION,
  rulesetId: RULESET_ID,
  scoring: { label: { en: 'Points', es: 'Puntos' } },
  tags: ['statistics', 'data', 'drawing', 'daily', 'economics', 'geography'],
  achievements: [
    {
      id: 'first-forecast',
      title: { en: 'Crystal Ball', es: 'Bola de cristal' },
      description: { en: 'Submit your first forecast.', es: 'Envía tu primer pronóstico.' },
    },
    {
      id: 'sharp-eye',
      title: { en: 'Sharp Eye', es: 'Ojo de lince' },
      description: { en: 'Score 95 or more on a graph.', es: 'Consigue 95 o más en una gráfica.' },
    },
    {
      id: 'hard-90',
      title: { en: 'Against the Odds', es: 'Contra todo pronóstico' },
      description: {
        en: 'Score 90 or more on a Hard graph.',
        es: 'Consigue 90 o más en una gráfica difícil.',
      },
    },
    {
      id: 'daily-400',
      title: { en: 'Analyst of the Day', es: 'Analista del día' },
      description: {
        en: 'Score 400 or more in a daily challenge.',
        es: 'Consigue 400 o más en un reto diario.',
      },
    },
    {
      id: 'beat-machine',
      title: { en: 'Human Intuition', es: 'Intuición humana' },
      description: {
        en: 'Beat the computer forecaster on 10 graphs.',
        es: 'Supera al pronosticador del ordenador en 10 gráficas.',
      },
    },
    {
      id: 'all-topics',
      title: { en: 'Polymath', es: 'Erudito' },
      description: {
        en: 'Score 80 or more in every topic.',
        es: 'Consigue 80 o más en todos los temas.',
      },
    },
    {
      id: 'week',
      title: { en: 'Weekly Briefing', es: 'Informe semanal' },
      description: {
        en: 'Play the daily challenge seven days in a row.',
        es: 'Juega el reto diario siete días seguidos.',
      },
    },
  ],
};
