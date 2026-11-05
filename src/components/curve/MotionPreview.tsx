import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Pause, Play, Repeat, RotateCcw,
} from 'lucide-react';
import type { AnimationSettings, BezierPoints, PreviewMode, SamplePoint } from './types';

interface MotionPreviewProps {
  bezier: BezierPoints;
  settings: AnimationSettings;
  currentState: SamplePoint;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onScrubTime: (time: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
}

const PREVIEW_MODES: { id: PreviewMode; label: string }[] = [
  { id: 'horizontal', label: 'Slide' },
  { id: 'scale', label: 'Scale' },
  { id: 'rotation', label: 'Rotate' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'opacity', label: 'Opacity' },
];

export function MotionPreview({
  bezier,
  settings,
  currentState,
  isPlaying,
  onTogglePlay,
  onReset,
  onScrubTime,
  playbackRate,
  onChangePlaybackRate,
  isLooping,
  onToggleLoop,
}: MotionPreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('horizontal');
  const progress = currentState.normalizedValue;
  const delta = settings.endValue - settings.startValue;
  const maxSpeed = Math.max(1, Math.abs(delta / Math.max(settings.duration, 1e-6)) * 2.5);
  const speedPercent = Math.min(100, Math.abs(currentState.speed) / maxSpeed * 100);
  const frameStep = 1 / settings.fps;

  const visual = () => {
    if (previewMode === 'horizontal') {
      return (
        <div className="curve-motion-track">
          <span className="curve-track-start">{settings.startValue}{settings.unit}</span>
          <span className="curve-track-end">{settings.endValue}{settings.unit}</span>
          <div className="curve-track-line"><i style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} /></div>
          <div className="curve-track-object" style={{ left: `calc(32px + (100% - 64px - 44px) * ${Math.max(-0.2, Math.min(1.2, progress))})` }}>
            <span>{currentState.value.toFixed(0)}</span>
          </div>
        </div>
      );
    }
    if (previewMode === 'scale') {
      return (
        <div className="curve-preview-shape">
          <div className="curve-scale-guide" />
          <div className="curve-scale-object" style={{
            transform: `scale(${Math.max(0.1, 0.3 + progress * 0.9)})`,
            opacity: Math.max(0.15, Math.min(1, 0.4 + progress * 0.6)),
          }}>{Math.round(progress * 100)}%</div>
        </div>
      );
    }
    if (previewMode === 'rotation') {
      return <div className="curve-rotation-ring"><div className="curve-rotation-object" style={{ transform: `rotate(${progress * 360}deg)` }}><i /></div></div>;
    }
    if (previewMode === 'bounce') {
      return <div className="curve-bounce-stage"><div className="curve-bounce-object" style={{
        transform: `translateY(${-progress * 82}px) scaleX(${1 + (1 - Math.min(1, progress)) * 0.2}) scaleY(${1 - (1 - Math.min(1, progress)) * 0.15})`,
      }}>Bounce</div></div>;
    }
    return <div className="curve-opacity-object" style={{
      opacity: Math.max(0.05, Math.min(1, progress)),
      transform: `translateY(${(1 - progress) * 20}px)`,
    }}>Elevation &amp; Fade · {progress.toFixed(2)}</div>;
  };

  return (
    <section id="preview" className="curve-preview-card">
      <header className="curve-panel-heading">
        <div className="flex items-center gap-2"><span className="curve-record-dot" /><h2>Real-Time Motion Sandbox</h2></div>
        <div className="curve-preview-tabs" role="tablist" aria-label="Motion preview type">
          {PREVIEW_MODES.map(({ id, label }) => (
            <button type="button" role="tab" aria-selected={previewMode === id} key={id} onClick={() => setPreviewMode(id)} className={previewMode === id ? 'active' : ''}>{label}</button>
          ))}
        </div>
      </header>
      <div className="curve-motion-stage">
        <div className="curve-live-readout">
          <span>Time <strong>{currentState.time.toFixed(2)}s</strong> <i>({Math.round(currentState.frame)}f)</i></span>
          <span>Value <strong>{currentState.value.toFixed(1)}{settings.unit}</strong></span>
          <span>Velocity <strong>{currentState.speed.toFixed(1)} {settings.unit}/s</strong></span>
        </div>
        <div className="curve-speedometer"><span>Vel</span><i><b style={{ width: `${speedPercent}%` }} /></i></div>
        {visual()}
      </div>
      <div className="curve-playback-controls">
        <input
          aria-label="Scrub animation timeline"
          type="range"
          min={0}
          max={settings.duration}
          step={settings.duration / 300}
          value={currentState.time}
          onChange={(event) => onScrubTime(Number(event.target.value))}
          className="curve-timeline"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Reset animation" title="Reset to 0 seconds" onClick={onReset} className="curve-playback-icon"><RotateCcw className="h-4 w-4" /></button>
            <button type="button" aria-label="Step backward one frame" onClick={() => onScrubTime(Math.max(0, currentState.time - frameStep))} className="curve-playback-icon"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={onTogglePlay} className="curve-play-button">{isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}{isPlaying ? 'Pause' : 'Play'}</button>
            <button type="button" aria-label="Step forward one frame" onClick={() => onScrubTime(Math.min(settings.duration, currentState.time + frameStep))} className="curve-playback-icon"><ChevronRight className="h-4 w-4" /></button>
            <button type="button" aria-label="Toggle looping" title={isLooping ? 'Looping enabled' : 'Looping disabled'} onClick={onToggleLoop} className={`curve-playback-icon ${isLooping ? 'active' : ''}`}><Repeat className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] text-slate-400"><strong className="text-slate-200">{currentState.time.toFixed(2)}s</strong> / {settings.duration.toFixed(2)}s <span className="text-slate-600">({Math.round(currentState.frame)} / {Math.round(settings.duration * settings.fps)}f)</span></span>
            <div className="curve-playback-rates">
              {[0.25, 0.5, 1, 2].map((rate) => <button type="button" key={rate} onClick={() => onChangePlaybackRate(rate)} className={playbackRate === rate ? 'active' : ''}>{rate}×</button>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
