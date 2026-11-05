import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { CurveHeader } from './CurveHeader';
import { MotionPreview } from './MotionPreview';
import { SidebarControls } from './SidebarControls';
import { SpeedGraph, ValueGraph } from './Graphs';
import { getStateAtTime } from './utils/bezierMath';
import { ALL_EASING_PRESETS } from './utils/presets';
import type { AnimationSettings, BezierPoints } from './types';

const INITIAL_BEZIER: BezierPoints = {
  p0: { x: 0, y: 0 },
  p1: { x: 0.333, y: 0 },
  p2: { x: 0.667, y: 1 },
  p3: { x: 1, y: 1 },
};

const INITIAL_SETTINGS: AnimationSettings = {
  startValue: 0,
  endValue: 100,
  duration: 2,
  fps: 30,
  unit: 'px',
};

interface CurveConverterProps {
  onToast: (message: string) => void;
}

export function CurveConverter({ onToast }: CurveConverterProps) {
  const [bezier, setBezier] = useState<BezierPoints>(INITIAL_BEZIER);
  const [settings, setSettings] = useState<AnimationSettings>(INITIAL_SETTINGS);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [activePreset, setActivePreset] = useState('Easy Ease');
  const playbackStart = useRef(0);
  const timeAtPlaybackStart = useRef(0);

  const currentState = useMemo(
    () => getStateAtTime(currentTime, bezier, settings),
    [currentTime, bezier, settings],
  );
  useEffect(() => {
    if (!isPlaying) return undefined;
    let frameId = 0;
    const update = (timestamp: number) => {
      const elapsed = (timestamp - playbackStart.current) / 1000 * playbackRate;
      const nextTime = timeAtPlaybackStart.current + elapsed;
      if (nextTime >= settings.duration) {
        if (isLooping) {
          const remainder = nextTime % settings.duration;
          playbackStart.current = timestamp;
          timeAtPlaybackStart.current = remainder;
          setCurrentTime(remainder);
          frameId = requestAnimationFrame(update);
        } else {
          setCurrentTime(settings.duration);
          setIsPlaying(false);
        }
        return;
      }
      setCurrentTime(Math.max(0, nextTime));
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isLooping, playbackRate, settings.duration]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (currentTime >= settings.duration) setCurrentTime(0);
    playbackStart.current = performance.now();
    timeAtPlaybackStart.current = currentTime >= settings.duration ? 0 : currentTime;
    setIsPlaying(true);
  };

  const scrub = (time: number) => {
    const nextTime = Math.max(0, Math.min(settings.duration, time));
    setCurrentTime(nextTime);
    if (isPlaying) {
      playbackStart.current = performance.now();
      timeAtPlaybackStart.current = nextTime;
    }
  };

  const handleBezierChange = (next: BezierPoints) => {
    setBezier(next);
    const matched = ALL_EASING_PRESETS.find((item) =>
      Math.abs(item.p1.x - next.p1.x) < 0.015
      && Math.abs(item.p1.y - next.p1.y) < 0.015
      && Math.abs(item.p2.x - next.p2.x) < 0.015
      && Math.abs(item.p2.y - next.p2.y) < 0.015);
    setActivePreset(matched?.name ?? '');
  };

  const resetTime = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <main className="curve-converter-page">
      <CurveHeader bezier={bezier} onToast={onToast} />
      <div className="curve-main">
        <div className="curve-page-intro">
          <div className="curve-intro-icon"><Activity className="h-5 w-5" /></div>
          <div>
            <p className="curve-kicker">Motion design workspace</p>
            <h1>Animation Curve Converter</h1>
            <p>Design and inspect a curve with live value and velocity feedback.</p>
          </div>
        </div>

        <div className="curve-workspace-grid">
          <div className="curve-workspace-main">
            <div id="graphs" className="curve-graphs-grid">
              <SpeedGraph
                bezier={bezier}
                settings={settings}
                currentTime={currentTime}
                currentState={currentState}
                onBezierChange={handleBezierChange}
                onScrubTime={scrub}
              />
              <ValueGraph
                bezier={bezier}
                settings={settings}
                currentTime={currentTime}
                currentState={currentState}
                onBezierChange={handleBezierChange}
                onScrubTime={scrub}
              />
            </div>

            <MotionPreview
              bezier={bezier}
              settings={settings}
              currentState={currentState}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onReset={resetTime}
              onScrubTime={scrub}
              playbackRate={playbackRate}
              onChangePlaybackRate={setPlaybackRate}
              isLooping={isLooping}
              onToggleLoop={() => setIsLooping((value) => !value)}
            />

          </div>

          <SidebarControls
            bezier={bezier}
            settings={settings}
            onBezierChange={handleBezierChange}
            onSettingsChange={setSettings}
            activePreset={activePreset}
            onPresetChange={setActivePreset}
          />
        </div>
        <footer className="curve-page-footer">
          <span>Drag graph handles to edit. Click either graph to scrub the animation.</span>
          <span><i /> All calculations run locally in your browser · No AI · No network calls</span>
        </footer>
      </div>
    </main>
  );
}
