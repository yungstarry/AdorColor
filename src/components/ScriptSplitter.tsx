import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, LayoutGrid, List, RotateCcw, Scissors, Sparkles, Timer, WandSparkles } from 'lucide-react';
import { countScriptWords, splitScript, SplitStyle } from '../utils/scriptSplitter';

const SPEED_OPTIONS = [
  { label: 'Slow', value: 2.2 },
  { label: 'Normal', value: 2.8 },
  { label: 'Fast', value: 3.3 },
] as const;

const DEFAULT_SCRIPT = '';
const SCRIPT_SPLITTER_STORAGE_KEY = 'palettelab_script_splitter';
const DEFAULT_STYLE: SplitStyle = 'natural';
type OutputView = 'cards' | 'single';

interface ScriptSplitterState {
  script: string;
  chunks: string[];
  duration: number;
  customDuration: string;
  speed: string;
  customSpeed: string;
  style: SplitStyle;
  hasSplit: boolean;
  outputView?: OutputView;
}

const DEFAULT_STATE: ScriptSplitterState = {
  script: DEFAULT_SCRIPT,
  chunks: [],
  duration: 3,
  customDuration: '3',
  speed: '2.8',
  customSpeed: '2.8',
  style: DEFAULT_STYLE,
  hasSplit: false,
  outputView: 'cards',
};

function isScriptSplitterState(value: unknown): value is ScriptSplitterState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;

  return (
    typeof state.script === 'string' &&
    Array.isArray(state.chunks) &&
    state.chunks.every((chunk) => typeof chunk === 'string') &&
    typeof state.duration === 'number' &&
    [0, 2, 3, 4, 5].includes(state.duration) &&
    typeof state.customDuration === 'string' &&
    typeof state.speed === 'string' &&
    ['2.2', '2.8', '3.3', 'custom'].includes(state.speed) &&
    typeof state.customSpeed === 'string' &&
    (state.style === 'natural' ||
      state.style === 'short' ||
      state.style === 'balanced' ||
      state.style === 'longer') &&
    typeof state.hasSplit === 'boolean' &&
    (state.outputView === undefined || state.outputView === 'cards' || state.outputView === 'single')
  );
}

function readSavedState(): { state: ScriptSplitterState; notice: string } {
  try {
    const saved = localStorage.getItem(SCRIPT_SPLITTER_STORAGE_KEY);
    if (!saved) return { state: DEFAULT_STATE, notice: '' };

    const parsed: unknown = JSON.parse(saved);
    if (!isScriptSplitterState(parsed)) throw new Error('Invalid saved state');
    return { state: { ...parsed, outputView: parsed.outputView ?? 'cards' }, notice: '' };
  } catch {
    return {
      state: DEFAULT_STATE,
      notice: 'Could not restore the saved splitter state. Starting with a fresh session.',
    };
  }
}

export function ScriptSplitter() {
  const [restored] = useState(readSavedState);
  const [script, setScript] = useState(restored.state.script);
  const [chunks, setChunks] = useState<string[]>(restored.state.chunks);
  const [duration, setDuration] = useState(restored.state.duration);
  const [customDuration, setCustomDuration] = useState(restored.state.customDuration);
  const [speed, setSpeed] = useState(restored.state.speed);
  const [customSpeed, setCustomSpeed] = useState(restored.state.customSpeed);
  const [style, setStyle] = useState<SplitStyle>(restored.state.style);
  const [hasSplit, setHasSplit] = useState(restored.state.hasSplit);
  const [outputView, setOutputView] = useState<OutputView>(restored.state.outputView ?? 'cards');
  const [notice, setNotice] = useState(restored.notice);

  useEffect(() => {
    const savedState: ScriptSplitterState = {
      script,
      chunks,
      duration,
      customDuration,
      speed,
      customSpeed,
      style,
      hasSplit,
      outputView,
    };

    try {
      localStorage.setItem(SCRIPT_SPLITTER_STORAGE_KEY, JSON.stringify(savedState));
    } catch {
      setNotice('Could not save splitter state. Check that browser storage is available.');
    }
  }, [script, chunks, duration, customDuration, speed, customSpeed, style, hasSplit, outputView]);

  const selectedDuration = duration === 0
    ? Math.min(30, Math.max(0.5, Number(customDuration) || 3))
    : duration;
  const selectedSpeed = speed === 'custom'
    ? Math.min(10, Math.max(0.5, Number(customSpeed) || 2.8))
    : Number(speed);
  const words = countScriptWords(script);
  const characters = script.length;
  const outputWords = useMemo(() => chunks.reduce((total, chunk) => total + countScriptWords(chunk), 0), [chunks]);
  const estimatedSeconds = outputWords / selectedSpeed;
  const averageWords = chunks.length ? outputWords / chunks.length : 0;

  const handleSplit = () => {
    const nextChunks = splitScript(script, selectedDuration, selectedSpeed, style);
    setChunks(nextChunks);
    setHasSplit(true);
    setNotice('');
  };

  const handleReset = () => {
    setScript('');
    setChunks([]);
    setDuration(3);
    setCustomDuration('3');
    setSpeed('2.8');
    setCustomSpeed('2.8');
    setStyle('natural');
    setHasSplit(false);
    setOutputView('cards');
    setNotice('');
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(message);
    } catch {
      setNotice('Clipboard access is unavailable. You can still select and copy the text manually.');
    }
  };

  const updateChunk = (index: number, value: string) => {
    setChunks((current) => current.map((chunk, chunkIndex) => chunkIndex === index ? value : chunk));
  };

  return (
    <main className="min-h-[calc(100vh-112px)] bg-[#0b0d12] px-4 py-10 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              CREATOR WORKSPACE
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Script Splitter</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Break your script into natural speaking chunks, ready for captions, subtitles, or edit markers.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Runs privately in your browser
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
          <div className="rounded-2xl border border-white/10 bg-[#12151d] p-4 shadow-2xl shadow-black/10 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Your script</h2>
                <p className="mt-1 text-xs text-slate-500">Keep your original wording. We’ll only add chunk breaks.</p>
              </div>
              <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-400">
                {words} words
              </span>
            </div>
            <textarea
              value={script}
              onChange={(event) => setScript(event.target.value)}
              placeholder="Paste your script here..."
              className="min-h-[300px] w-full resize-y rounded-xl border border-white/10 bg-[#0c0f15] p-4 text-sm leading-7 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 sm:min-h-[390px]"
              aria-label="Script to split"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{characters.toLocaleString()} characters</span>
              <span>Text stays on this device</span>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-[#12151d] p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-200">
                  <Timer className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Target duration</h2>
                  <p className="text-xs text-slate-500">A flexible speaking-time target</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5].map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => setDuration(seconds)}
                    aria-pressed={duration === seconds}
                    className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                      duration === seconds
                        ? 'border-violet-300/50 bg-violet-400/15 text-violet-100'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDuration(0)}
                  aria-pressed={duration === 0}
                  className={`rounded-lg border px-1 py-2.5 text-xs font-medium transition ${
                    duration === 0
                      ? 'border-violet-300/50 bg-violet-400/15 text-violet-100'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>
              {duration === 0 && (
                <label className="mt-3 block text-xs text-slate-400">
                  Seconds per chunk
                  <input
                    type="number"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={customDuration}
                    onChange={(event) => setCustomDuration(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c0f15] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
                  />
                </label>
              )}

              <details className="group mt-5 border-t border-white/[0.08] pt-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-slate-300">
                  Advanced settings
                  <span className="text-slate-500 transition group-open:rotate-180">⌄</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <label className="block text-xs text-slate-400">
                    Speaking speed
                    <select
                      value={speed}
                      onChange={(event) => setSpeed(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c0f15] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-400/50"
                    >
                      {SPEED_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>{option.label} · {option.value} words/sec</option>
                      ))}
                      <option value="custom">Custom speed</option>
                    </select>
                  </label>
                  {speed === 'custom' && (
                    <label className="block text-xs text-slate-400">
                      Words per second
                      <input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={customSpeed}
                        onChange={(event) => setCustomSpeed(event.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c0f15] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
                      />
                    </label>
                  )}
                  <label className="block text-xs text-slate-400">
                    Splitting style
                    <select
                      value={style}
                      onChange={(event) => setStyle(event.target.value as SplitStyle)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0c0f15] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-400/50"
                    >
                      <option value="natural">Natural · recommended</option>
                      <option value="short">Short</option>
                      <option value="balanced">Balanced</option>
                      <option value="longer">Longer</option>
                    </select>
                  </label>
                </div>
              </details>
            </div>

            <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/[0.09] to-indigo-400/[0.03] p-5">
              <div className="flex items-start gap-3">
                <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />
                <div>
                  <h3 className="text-xs font-semibold text-violet-100">Natural pacing</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">
                    Sentence endings and phrase pauses guide the split. Word count is a target, not a hard limit.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSplit}
                disabled={!script.trim()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-300 px-4 text-sm font-semibold text-[#171222] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Scissors className="h-4 w-4" />
                {hasSplit ? 'Re-split script' : 'Split script'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </aside>
        </section>

        {hasSplit && (
          <section className="mt-8" aria-live="polite">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Your breakdown</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Chunks <span className="text-slate-500">({chunks.length})</span></h2>
                <p className="mt-1 text-xs text-slate-400">
                  {chunks.length} chunks <span className="px-1 text-slate-600">•</span>
                  ~{estimatedSeconds.toFixed(1)} sec total <span className="px-1 text-slate-600">•</span>
                  {averageWords.toFixed(1)} words/chunk average
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div role="group" aria-label="Output layout" className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
                  <button
                    type="button"
                    onClick={() => setOutputView('cards')}
                    aria-pressed={outputView === 'cards'}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                      outputView === 'cards' ? 'bg-violet-300/15 text-violet-100' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputView('single')}
                    aria-pressed={outputView === 'single'}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                      outputView === 'single' ? 'bg-violet-300/15 text-violet-100' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    One card
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(chunks.join('\n\n'), 'All chunks copied to clipboard.')}
                  disabled={chunks.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy all
                </button>
              </div>
            </div>

            {chunks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center text-sm text-slate-500">
                Add a script above to create your first chunk.
              </div>
            ) : (
              outputView === 'single' ? (
                <article className="rounded-xl border border-white/[0.09] bg-[#12151d] p-4 transition hover:border-violet-300/25 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-violet-300">
                      <List className="h-3.5 w-3.5" />
                      {chunks.length} LINES
                    </span>
                    <span className="text-[11px] text-slate-500">One chunk per line</span>
                  </div>
                  <textarea
                    value={chunks.join('\n')}
                    onChange={(event) => setChunks(event.target.value.split('\n'))}
                    aria-label="Edit all chunks, one chunk per line"
                    rows={Math.max(4, Math.min(18, chunks.length))}
                    className="min-h-32 w-full resize-y bg-transparent text-sm leading-7 text-slate-200 outline-none placeholder:text-slate-600"
                  />
                </article>
              ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {chunks.map((chunk, index) => {
                  const chunkWords = countScriptWords(chunk);
                  return (
                    <article key={index} className="group rounded-xl border border-white/[0.09] bg-[#12151d] p-4 transition hover:border-violet-300/25">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold tracking-wider text-violet-300">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>{(chunkWords / selectedSpeed).toFixed(1)}s</span>
                          <button
                            type="button"
                            onClick={() => void copyText(chunk, `Chunk ${String(index + 1).padStart(2, '0')} copied.`)}
                            aria-label={`Copy chunk ${index + 1}`}
                            className="rounded p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={chunk}
                        onChange={(event) => updateChunk(index, event.target.value)}
                        aria-label={`Edit chunk ${index + 1}`}
                        rows={Math.max(2, Math.min(5, Math.ceil(chunk.length / 42)))}
                        className="w-full resize-y bg-transparent text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600"
                      />
                      <div className="mt-2 border-t border-white/[0.06] pt-2 text-[10px] text-slate-600">
                        {chunkWords} {chunkWords === 1 ? 'word' : 'words'}
                      </div>
                    </article>
                  );
                })}
              </div>
              )
            )}
            {notice && (
              <p className={`mt-3 inline-flex items-center gap-2 text-xs ${notice.startsWith('Clipboard') ? 'text-amber-300' : 'text-emerald-300'}`}>
                {!notice.startsWith('Clipboard') && <Check className="h-3.5 w-3.5" />}
                {notice}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
