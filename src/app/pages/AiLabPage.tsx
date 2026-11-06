import { Bot, Download, FlaskConical, Gamepad2, Play, Square, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AI_BUNDLES, loadAiBundle, type AnyBundle } from '../../ai/adapters/registry';
import type { EvaluationReport } from '../../ai/evaluation/evaluate';
import type { EvaluateRequest, WorkerMessage } from '../../ai/evaluation/protocol';
import { createTranslator, pickText, type Dictionary, type Locale } from '../../core/i18n';
import { MANIFESTS } from '../../games/registry';
import { useLocale, usePlatform } from '../platform';
import { href } from '../router';
import styles from './pages.module.css';
import lab from './AiLabPage.module.css';

const STRINGS: Record<Locale, Dictionary> = {
  en: {
    title: 'AI Lab',
    subtitle:
      'Every game exposes a standard environment interface driven by its real rules engine. Run reproducible evaluations between baseline agents right in your browser.',
    arena: 'Arena: agent vs agent',
    game: 'Game',
    agentA: 'Agent A',
    agentB: 'Agent B',
    games: 'Games',
    seed: 'Seed',
    run: 'Run evaluation',
    stop: 'Stop',
    running: 'Running… {done} / {total}',
    noGames: 'No games with AI environments are available yet.',
    results: 'Result',
    wins: 'Wins',
    draws: 'Draws',
    losses: 'Losses',
    winRate: 'Win rate',
    latency: 'Avg decision',
    nodes: 'Avg nodes',
    avgMoves: 'Average moves per game: {n}',
    reproduce:
      'Game {game} v{version} · ruleset {ruleset} · seeds {from}–{to} · seats alternate each game',
    download: 'Download JSON',
    history: 'Evaluation history',
    historyEmpty: 'Evaluations you run are stored here, in this browser only.',
    delete: 'Delete',
    agents: 'Baseline agents',
    play: 'Play against the computer',
    watch: 'Watch AI vs AI',
    future: 'Planned research features',
    futureBody:
      'These parts of the lab are designed (see docs/ai-integration.md and training/) but not implemented yet. Nothing below is simulated.',
    'feature.training': 'Training runs and history',
    'feature.curves': 'Learning curves',
    'feature.models': 'Model loading and selection',
    'feature.inference': 'In-browser neural inference (ONNX Runtime Web)',
    'feature.compare': 'Model performance comparisons',
    'kind.random': 'Random',
    'kind.heuristic': 'Heuristic',
    'kind.search': 'Search',
    'kind.mcts': 'Monte Carlo',
    'kind.solver': 'Exact solver',
    'kind.learned': 'Learned',
    notImplemented: 'Not yet implemented',
  },
  es: {
    title: 'Laboratorio IA',
    subtitle:
      'Cada juego expone una interfaz de entorno estándar basada en su motor de reglas real. Ejecuta evaluaciones reproducibles entre agentes de referencia en tu navegador.',
    arena: 'Arena: agente contra agente',
    game: 'Juego',
    agentA: 'Agente A',
    agentB: 'Agente B',
    games: 'Partidas',
    seed: 'Semilla',
    run: 'Ejecutar evaluación',
    stop: 'Detener',
    running: 'Ejecutando… {done} / {total}',
    noGames: 'Todavía no hay juegos con entornos de IA disponibles.',
    results: 'Resultado',
    wins: 'Victorias',
    draws: 'Empates',
    losses: 'Derrotas',
    winRate: 'Tasa de victoria',
    latency: 'Decisión media',
    nodes: 'Nodos medios',
    avgMoves: 'Movimientos medios por partida: {n}',
    reproduce:
      'Juego {game} v{version} · reglas {ruleset} · semillas {from}–{to} · los asientos alternan en cada partida',
    download: 'Descargar JSON',
    history: 'Historial de evaluaciones',
    historyEmpty: 'Las evaluaciones que ejecutes se guardan aquí, solo en este navegador.',
    delete: 'Eliminar',
    agents: 'Agentes de referencia',
    play: 'Jugar contra la computadora',
    watch: 'Ver IA contra IA',
    future: 'Funciones de investigación planificadas',
    futureBody:
      'Estas partes del laboratorio están diseñadas (ver docs/ai-integration.md y training/) pero aún no implementadas. Nada de lo que sigue es simulado.',
    'feature.training': 'Entrenamientos e historial',
    'feature.curves': 'Curvas de aprendizaje',
    'feature.models': 'Carga y selección de modelos',
    'feature.inference': 'Inferencia neuronal en el navegador (ONNX Runtime Web)',
    'feature.compare': 'Comparación de rendimiento de modelos',
    'kind.random': 'Aleatorio',
    'kind.heuristic': 'Heurístico',
    'kind.search': 'Búsqueda',
    'kind.mcts': 'Monte Carlo',
    'kind.solver': 'Solucionador exacto',
    'kind.learned': 'Aprendido',
    notImplemented: 'Aún no implementado',
  },
};

const HISTORY_PREFIX = 'ai-eval:';

export function AiLabPage() {
  const locale = useLocale();
  const t = useMemo(() => createTranslator(STRINGS, locale), [locale]);
  const { kv } = usePlatform();
  const games = MANIFESTS.filter((m) => m.id in AI_BUNDLES);
  const [gameId, setGameId] = useState(games[0]?.id ?? '');
  const [bundle, setBundle] = useState<AnyBundle | null>(null);
  const [agentA, setAgentA] = useState('');
  const [agentB, setAgentB] = useState('');
  const [count, setCount] = useState(100);
  const [seed, setSeed] = useState(1);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ key: string; report: EvaluationReport }[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    void loadAiBundle(gameId).then((b) => {
      if (cancelled) return;
      setBundle(b);
      setAgentA(b.agents[b.agents.length - 1]?.id ?? '');
      setAgentB(b.agents[0]?.id ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const loadHistory = useCallback(async () => {
    const keys = (await kv.keys(HISTORY_PREFIX)).sort().reverse();
    const items = await Promise.all(
      keys.map(async (key) => ({ key, report: await kv.get<EvaluationReport>(key) })),
    );
    return items.filter(
      (i): i is { key: string; report: EvaluationReport } => i.report !== undefined,
    );
  }, [kv]);
  const refreshHistory = () => loadHistory().then(setHistory);

  useEffect(() => {
    let cancelled = false;
    void loadHistory().then((items) => !cancelled && setHistory(items));
    return () => {
      cancelled = true;
      workerRef.current?.terminate();
    };
  }, [loadHistory]);

  const run = () => {
    workerRef.current?.terminate();
    const worker = new Worker(
      new URL('../../ai/evaluation/evaluation.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;
    setReport(null);
    setError(null);
    setProgress({ done: 0, total: count });
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === 'progress') setProgress({ done: msg.completed, total: msg.total });
      if (msg.type === 'error') {
        setError(msg.message);
        setProgress(null);
        worker.terminate();
      }
      if (msg.type === 'done') {
        setReport(msg.report);
        setProgress(null);
        worker.terminate();
        void kv.set(`${HISTORY_PREFIX}${msg.report.createdAt}`, msg.report).then(refreshHistory);
      }
    };
    const request: EvaluateRequest = {
      type: 'evaluate',
      gameId,
      agentA,
      agentB,
      games: count,
      seed,
    };
    worker.postMessage(request);
  };

  const stop = () => {
    workerRef.current?.terminate();
    setProgress(null);
  };

  return (
    <div className="page">
      <h1 className="page-title">
        <FlaskConical
          size={30}
          style={{ display: 'inline', verticalAlign: '-4px', marginRight: 8 }}
        />
        {t('title')}
      </h1>
      <p className="page-subtitle">{t('subtitle')}</p>

      <section className={styles.section} aria-labelledby="arena-title">
        <h2
          id="arena-title"
          className={styles.sectionTitle}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {t('arena')}
        </h2>
        {games.length === 0 ? (
          <div className={styles.empty}>{t('noGames')}</div>
        ) : (
          <div className={`panel ${lab.arena}`}>
            <div className={lab.controls}>
              <label className="field">
                {t('game')}
                <select
                  className="select"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  disabled={!!progress}
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {pickText(g.title, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t('agentA')}
                <select
                  className="select"
                  value={agentA}
                  onChange={(e) => setAgentA(e.target.value)}
                  disabled={!!progress}
                  data-testid="agent-a"
                >
                  {bundle?.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {pickText(a.label, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t('agentB')}
                <select
                  className="select"
                  value={agentB}
                  onChange={(e) => setAgentB(e.target.value)}
                  disabled={!!progress}
                  data-testid="agent-b"
                >
                  {bundle?.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {pickText(a.label, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t('games')}
                <select
                  className="select"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  disabled={!!progress}
                >
                  {[10, 50, 100, 500, 1000].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                {t('seed')}
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={seed}
                  onChange={(e) => setSeed(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  disabled={!!progress}
                />
              </label>
            </div>
            <div
              className={styles.row}
              style={{ justifyContent: 'flex-start', marginTop: 'var(--space-4)' }}
            >
              {progress ? (
                <button type="button" className="btn" onClick={stop}>
                  <Square size={16} /> {t('stop')}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={run}
                  disabled={!bundle || !agentA || !agentB}
                  data-testid="run-evaluation"
                >
                  <Play size={16} /> {t('run')}
                </button>
              )}
              {progress && (
                <span className="muted" aria-live="polite">
                  {t('running', { done: progress.done, total: progress.total })}
                </span>
              )}
            </div>
            {progress && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            )}
            {error && (
              <p role="alert" style={{ color: 'var(--danger)', marginTop: 'var(--space-3)' }}>
                {error}
              </p>
            )}
            {report && <ReportView report={report} t={t} />}
          </div>
        )}
      </section>

      {bundle && (
        <section className={styles.section} aria-labelledby="agents-title">
          <h2
            id="agents-title"
            className={styles.sectionTitle}
            style={{ marginBottom: 'var(--space-4)' }}
          >
            {t('agents')}
          </h2>
          <ul className={styles.achievementList}>
            {bundle.agents.map((a) => (
              <li key={a.id} className={styles.achievement} data-locked="false">
                <span className={styles.achievementIcon} aria-hidden="true">
                  <Bot size={18} />
                </span>
                <span>
                  <span className={styles.achievementTitle}>{pickText(a.label, locale)}</span>{' '}
                  <span className={lab.kind}>{t(`kind.${a.kind}`)}</span>
                  <br />
                  <span className={styles.achievementDesc}>{pickText(a.description, locale)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div
            className={styles.row}
            style={{ justifyContent: 'flex-start', marginTop: 'var(--space-4)' }}
          >
            <a className="btn" href={href(`/game/${gameId}`)}>
              <Gamepad2 size={16} /> {t('play')}
            </a>
            <a className="btn" href={href(`/game/${gameId}`, { mode: 'watch' })}>
              <Bot size={16} /> {t('watch')}
            </a>
          </div>
        </section>
      )}

      <section className={styles.section} aria-labelledby="history-title">
        <h2
          id="history-title"
          className={styles.sectionTitle}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {t('history')}
        </h2>
        {history.length === 0 ? (
          <div className={styles.empty}>{t('historyEmpty')}</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('game')}</th>
                  <th scope="col">{t('agentA')}</th>
                  <th scope="col">{t('agentB')}</th>
                  <th scope="col">{t('games')}</th>
                  <th scope="col">
                    A: {t('wins')} / {t('draws')} / {t('losses')}
                  </th>
                  <th scope="col">{t('seed')}</th>
                  <th scope="col">
                    <span className="visually-hidden">{t('delete')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map(({ key, report: r }) => (
                  <tr key={key}>
                    <td>
                      {r.gameId} <span className="muted">v{r.gameVersion}</span>
                    </td>
                    <td>{r.agents[0].label}</td>
                    <td>{r.agents[1].label}</td>
                    <td>{r.games}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {r.agents[0].wins} / {r.agents[0].draws} / {r.agents[0].losses}
                    </td>
                    <td>{r.seed}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        aria-label={t('delete')}
                        onClick={() => void kv.delete(key).then(refreshHistory)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="future-title">
        <h2
          id="future-title"
          className={styles.sectionTitle}
          style={{ marginBottom: 'var(--space-2)' }}
        >
          {t('future')}
        </h2>
        <p className="muted" style={{ marginBottom: 'var(--space-4)' }}>
          {t('futureBody')}
        </p>
        <ul className={styles.achievementList}>
          {['training', 'curves', 'models', 'inference', 'compare'].map((f) => (
            <li key={f} className={styles.achievement} data-locked="true">
              <span className={styles.achievementIcon} aria-hidden="true">
                <FlaskConical size={16} />
              </span>
              <span>
                <span className={styles.achievementTitle}>{t(`feature.${f}`)}</span>
                <br />
                <span className={styles.achievementDesc}>{t('notImplemented')}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReportView({
  report,
  t,
}: {
  report: EvaluationReport;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const download = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eval-${report.gameId}-${report.agents[0].id}-vs-${report.agents[1].id}-seed${report.seed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className={lab.report} data-testid="evaluation-report">
      <h3>{t('results')}</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Agent</th>
              <th scope="col">{t('wins')}</th>
              <th scope="col">{t('draws')}</th>
              <th scope="col">{t('losses')}</th>
              <th scope="col">{t('winRate')}</th>
              <th scope="col">{t('latency')}</th>
              <th scope="col">{t('nodes')}</th>
            </tr>
          </thead>
          <tbody>
            {report.agents.map((a) => (
              <tr key={a.id + a.label}>
                <td>{a.label}</td>
                <td>{a.wins}</td>
                <td>{a.draws}</td>
                <td>{a.losses}</td>
                <td>{pct(a.winRate)}</td>
                <td>{a.averageLatencyMs.toFixed(2)} ms</td>
                <td>{a.averageNodes === null ? '—' : Math.round(a.averageNodes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
        {t('avgMoves', { n: report.averageMoves.toFixed(2) })}
        <br />
        {t('reproduce', {
          game: report.gameId,
          version: report.gameVersion,
          ruleset: report.rulesetId,
          from: report.seeds[0] ?? 0,
          to: report.seeds[report.seeds.length - 1] ?? 0,
        })}
      </p>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 'var(--space-3)' }}
        onClick={download}
      >
        <Download size={16} /> {t('download')}
      </button>
    </div>
  );
}
