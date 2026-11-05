import { useMemo, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { Crosshair, Eye, EyeOff } from 'lucide-react';
import {
  bezierToAEVelocity,
  evaluateBezier,
  getStateAtTime,
  sampleAnimationCurve,
  solveBezierParamForX,
  updateBezierFromSpeedHandle,
} from './utils/bezierMath';
import type { AnimationSettings, BezierPoints, SamplePoint } from './types';

const WIDTH = 680;
const HEIGHT = 360;
const PAD_X = 54;
const PAD_Y = 38;
const PLOT_W = WIDTH - PAD_X * 2;
const PLOT_H = HEIGHT - PAD_Y * 2;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface CommonGraphProps {
  bezier: BezierPoints;
  settings: AnimationSettings;
  currentTime: number;
  currentState: SamplePoint;
  onBezierChange: (bezier: BezierPoints) => void;
  onScrubTime: (time: number) => void;
}

interface ValueGraphProps extends CommonGraphProps {}

interface SpeedGraphProps extends CommonGraphProps {}

function axisLabel(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(1)).toString() : '0';
}

function GraphShell({
  title,
  formula,
  accent,
  controls,
  children,
}: {
  title: string;
  formula: string;
  accent: 'sky' | 'emerald';
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="curve-graph-card min-w-0">
      <header className="curve-graph-header">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`curve-graph-dot curve-dot-${accent}`} />
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          <span className="hidden truncate text-[11px] text-slate-500 sm:inline">{formula}</span>
        </div>
        {controls}
      </header>
      {children}
    </section>
  );
}

function ValueGraph({ bezier, settings, currentTime, onBezierChange, onScrubTime }: ValueGraphProps) {
  const activeHandle = useRef<'p1' | 'p2' | 'scrub' | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; time: number; value: number } | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showReticle, setShowReticle] = useState(true);
  const minY = Math.min(0, bezier.p1.y, bezier.p2.y, -0.15) - 0.1;
  const maxY = Math.max(1, bezier.p1.y, bezier.p2.y, 1.15) + 0.1;
  const toPoint = (x: number, y: number) => ({
    x: PAD_X + x * PLOT_W,
    y: HEIGHT - PAD_Y - ((y - minY) / (maxY - minY)) * PLOT_H,
  });
  const fromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * WIDTH, PAD_X, WIDTH - PAD_X),
      y: clamp(((event.clientY - rect.top) / rect.height) * HEIGHT, PAD_Y, HEIGHT - PAD_Y),
    };
  };
  const curvePath = useMemo(() => Array.from({ length: 121 }, (_, index) => {
    const t = index / 120;
    const result = evaluateBezier(t, bezier.p1.x, bezier.p1.y, bezier.p2.x, bezier.p2.y);
    const point = toPoint(result.x, result.y);
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' '), [bezier, minY, maxY]);
  const p0 = toPoint(0, 0);
  const p1 = toPoint(bezier.p1.x, bezier.p1.y);
  const p2 = toPoint(bezier.p2.x, bezier.p2.y);
  const p3 = toPoint(1, 1);
  const current = getStateAtTime(currentTime, bezier, settings);
  const playhead = toPoint(current.normalizedTime, current.normalizedValue);
  const ticks = Array.from({ length: 6 }, (_, index) => index / 5);

  const beginPointer = (event: PointerEvent<SVGSVGElement>) => {
    const pos = fromPointer(event);
    const handles = [
      { id: 'p1' as const, point: p1 },
      { id: 'p2' as const, point: p2 },
    ];
    const hit = handles.find(({ point }) => Math.hypot(pos.x - point.x, pos.y - point.y) < 24);
    activeHandle.current = hit?.id ?? 'scrub';
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!hit) onScrubTime(((pos.x - PAD_X) / PLOT_W) * settings.duration);
    else event.preventDefault();
  };

  const movePointer = (event: PointerEvent<SVGSVGElement>) => {
    const pos = fromPointer(event);
    const x = clamp((pos.x - PAD_X) / PLOT_W, 0, 1);
    const y = minY + (1 - (pos.y - PAD_Y) / PLOT_H) * (maxY - minY);
    const state = getStateAtTime(x * settings.duration, bezier, settings);
    setHoverPoint({ x: pos.x, y: pos.y, time: x * settings.duration, value: state.value });
    if (activeHandle.current === 'scrub') {
      onScrubTime(x * settings.duration);
    } else if (activeHandle.current === 'p1' || activeHandle.current === 'p2') {
      onBezierChange({
        ...bezier,
        [activeHandle.current]: {
          x: Number(clamp(x, 0.001, 0.999).toFixed(4)),
          y: Number(y.toFixed(4)),
        },
      });
    }
  };

  return (
    <GraphShell
      title="Value Graph"
      formula="V(t) · Slope = Speed (dV/dt)"
      accent="sky"
      controls={
        <div className="flex items-center gap-3">
          <button type="button" className="curve-graph-option" onClick={() => setShowReticle((value) => !value)} title="Toggle reticle">
            <Crosshair className="h-3.5 w-3.5" /> <span>Reticle</span>
          </button>
          <button type="button" className="curve-graph-option" onClick={() => setShowLabels((value) => !value)} title="Toggle point labels">
            {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} <span>Labels</span>
          </button>
        </div>
      }
    >
      <div className="curve-graph-stage">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Interactive value curve. Drag the P1 and P2 handles to edit, or click the graph to scrub."
          className="curve-chart"
          onPointerDown={beginPointer}
          onPointerMove={movePointer}
          onPointerUp={() => { activeHandle.current = null; }}
          onPointerCancel={() => { activeHandle.current = null; }}
          onPointerLeave={() => { if (!activeHandle.current) setHoverPoint(null); }}
        >
          <defs>
            <linearGradient id="curve-value-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          {ticks.map((tick) => {
            const x = PAD_X + tick * PLOT_W;
            const y = PAD_Y + tick * PLOT_H;
            const norm = maxY - tick * (maxY - minY);
            const value = settings.startValue + norm * (settings.endValue - settings.startValue);
            return (
              <g key={tick}>
                <path d={`M ${x} ${PAD_Y} V ${HEIGHT - PAD_Y} M ${PAD_X} ${y} H ${WIDTH - PAD_X}`} className="curve-grid" />
                <text x={x} y={HEIGHT - 12} textAnchor="middle" className="curve-tick">{(tick * settings.duration).toFixed(1)}s</text>
                <text x={PAD_X - 9} y={y + 3} textAnchor="end" className="curve-tick">{axisLabel(value)}{settings.unit}</text>
              </g>
            );
          })}
          {[0, 1].map((value) => {
            const point = toPoint(0, value);
            return <path key={value} d={`M ${PAD_X} ${point.y} H ${WIDTH - PAD_X}`} className="curve-guide" />;
          })}
          <path d={`M ${PAD_X} ${PAD_Y} V ${HEIGHT - PAD_Y} H ${WIDTH - PAD_X}`} className="curve-axis" />
          <path d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} M ${p3.x} ${p3.y} L ${p2.x} ${p2.y}`} className="curve-value-handle-line" />
          <path d={curvePath} className="curve-value-line" />
          <path d={`M ${playhead.x} ${PAD_Y} V ${HEIGHT - PAD_Y}`} className="curve-playhead-line" />
          <circle cx={playhead.x} cy={playhead.y} r="5" className="curve-playhead-dot" />
          {[{ point: p0, label: 'P0', color: 'start' }, { point: p3, label: 'P3', color: 'end' }].map(({ point, label, color }) => (
            <g key={label} pointerEvents="none">
              <circle cx={point.x} cy={point.y} r="5" className={`curve-anchor-${color}`} />
              {showLabels && <text x={point.x + 8} y={point.y - 8} className="curve-point-label">{label}</text>}
            </g>
          ))}
          {[{ point: p1, id: 'p1', color: 'sky' }, { point: p2, id: 'p2', color: 'indigo' }].map(({ point, id, color }) => (
            <g key={id} pointerEvents="none">
              <circle cx={point.x} cy={point.y} r="12" className="curve-handle-halo" />
              <circle cx={point.x} cy={point.y} r="7" className={`curve-handle-dot curve-handle-${color}`} />
              {showLabels && <text x={point.x + 10} y={point.y - 9} className="curve-point-label">{id.toUpperCase()} ({bezier[id as 'p1' | 'p2'].x.toFixed(2)}, {bezier[id as 'p1' | 'p2'].y.toFixed(2)})</text>}
            </g>
          ))}
          {showReticle && hoverPoint && (
            <g pointerEvents="none">
              <path d={`M ${PAD_X} ${hoverPoint.y} H ${WIDTH - PAD_X} M ${hoverPoint.x} ${PAD_Y} V ${HEIGHT - PAD_Y}`} className="curve-reticle" />
              <rect x={Math.min(hoverPoint.x + 10, WIDTH - 138)} y={Math.max(PAD_Y + 4, hoverPoint.y - 24)} width="126" height="19" rx="4" className="curve-reticle-badge" />
              <text x={Math.min(hoverPoint.x + 16, WIDTH - 132)} y={Math.max(PAD_Y + 17, hoverPoint.y - 11)} className="curve-reticle-text">{hoverPoint.time.toFixed(2)}s · {hoverPoint.value.toFixed(1)}{settings.unit}</text>
            </g>
          )}
        </svg>
        <div className="curve-graph-legend">
          <span><i className="bg-sky-400" /> Curve</span>
          <span><i className="bg-rose-400" /> Tangent speed</span>
          <span>Range: {settings.startValue} → {settings.endValue}{settings.unit}</span>
        </div>
      </div>
    </GraphShell>
  );
}

function SpeedGraph({ bezier, settings, currentTime, currentState, onBezierChange, onScrubTime }: SpeedGraphProps) {
  const drag = useRef<{
    side: 'start' | 'end' | 'scrub';
    baseTime: number;
    baseSpeed: number;
    pointerTime: number;
    pointerSpeed: number;
    clientX: number;
    clientY: number;
    axisLock: 'time' | 'speed' | null;
  } | null>(null);
  const [showReticle, setShowReticle] = useState(true);
  const [showArea, setShowArea] = useState(true);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; time: number; speed: number } | null>(null);
  const [lockedRange, setLockedRange] = useState<{ min: number; max: number } | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<'start' | 'end' | null>(null);
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null);
  const data = useMemo(() => sampleAnimationCurve(bezier, settings, 160), [bezier, settings]);
  const velocity = useMemo(() => bezierToAEVelocity(bezier, settings), [bezier, settings]);
  const allSpeeds = [
    ...data.samples.map(({ speed }) => speed),
    velocity.outgoingSpeed,
    velocity.incomingSpeed,
    0,
  ];
  const minSpeed = Math.min(0, ...allSpeeds);
  const maxSpeed = Math.max(0, ...allSpeeds);
  const span = Math.max(1, maxSpeed - minSpeed);
  const plotMin = lockedRange?.min ?? minSpeed - span * 0.12;
  const plotMax = lockedRange?.max ?? maxSpeed + span * 0.15;
  const averageSpeed = (settings.endValue - settings.startValue) / Math.max(settings.duration, 1e-6);
  const canEditSpeed = Math.abs(settings.endValue - settings.startValue) >= 1e-8;
  const peakSpeed = data.samples.reduce(
    (maximum, sample) => Math.abs(sample.speed) > Math.abs(maximum) ? sample.speed : maximum,
    0,
  );
  const toPoint = (time: number, speed: number) => ({
    x: PAD_X + clamp(time / Math.max(settings.duration, 1e-6), 0, 1) * PLOT_W,
    y: HEIGHT - PAD_Y - ((speed - plotMin) / (plotMax - plotMin)) * PLOT_H,
  });
  const pointerToGraph = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    const x = clamp(((clientX - rect.left) / rect.width) * WIDTH, PAD_X, WIDTH - PAD_X);
    const y = clamp(((clientY - rect.top) / rect.height) * HEIGHT, PAD_Y, HEIGHT - PAD_Y);
    return {
      x,
      y,
      time: ((x - PAD_X) / PLOT_W) * settings.duration,
      speed: plotMax - ((y - PAD_Y) / PLOT_H) * (plotMax - plotMin),
    };
  };
  const curvePath = data.samples.map((sample, index) => {
    const point = toPoint(sample.time, sample.speed);
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');
  const zeroPoint = toPoint(0, 0);
  const startPoint = toPoint(0, velocity.outgoingSpeed);
  const endPoint = toPoint(settings.duration, velocity.incomingSpeed);
  const startHandle = toPoint(bezier.p1.x * settings.duration, velocity.outgoingSpeed);
  const endHandle = toPoint(bezier.p2.x * settings.duration, velocity.incomingSpeed);
  const ticks = Array.from({ length: 6 }, (_, index) => index / 5);
  const handleGap = Math.hypot(startHandle.x - endHandle.x, startHandle.y - endHandle.y);
  const handleFan = clamp((44 - handleGap) / 2, 0, 12);
  const handles = [
    { side: 'start' as const, point: { ...startHandle, x: startHandle.x - handleFan }, time: bezier.p1.x * settings.duration, speed: velocity.outgoingSpeed, influence: velocity.outgoingInfluence },
    { side: 'end' as const, point: { ...endHandle, x: endHandle.x + handleFan }, time: bezier.p2.x * settings.duration, speed: velocity.incomingSpeed, influence: velocity.incomingInfluence },
  ];

  const beginPointer = (event: PointerEvent<SVGSVGElement>) => {
    const pos = pointerToGraph(event.currentTarget, event.clientX, event.clientY);
    const hit = handles
      .map((handle) => ({ ...handle, distance: Math.hypot(pos.x - handle.point.x, pos.y - handle.point.y) }))
      .filter(({ distance }) => distance < 36)
      .sort((a, b) => a.distance - b.distance)[0];
    drag.current = hit && canEditSpeed
      ? {
          side: hit.side,
          baseTime: hit.time,
          baseSpeed: hit.speed,
          pointerTime: pos.time,
          pointerSpeed: pos.speed,
          clientX: event.clientX,
          clientY: event.clientY,
          axisLock: null,
        }
      : {
          side: 'scrub',
          baseTime: pos.time,
          baseSpeed: pos.speed,
          pointerTime: pos.time,
          pointerSpeed: pos.speed,
          clientX: event.clientX,
          clientY: event.clientY,
          axisLock: null,
        };
    if (hit && canEditSpeed) {
      setLockedRange({ min: plotMin, max: plotMax });
      setActiveHandle(hit.side);
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!hit) onScrubTime(pos.time);
    else event.preventDefault();
  };

  const movePointer = (event: PointerEvent<SVGSVGElement>) => {
    const pos = pointerToGraph(event.currentTarget, event.clientX, event.clientY);
    setHoverPoint({ x: pos.x, y: pos.y, time: pos.time, speed: pos.speed });
    const currentDrag = drag.current;
    if (!currentDrag) {
      const nextHovered = handles
        .map((handle) => ({ side: handle.side, distance: Math.hypot(pos.x - handle.point.x, pos.y - handle.point.y) }))
        .filter(({ distance }) => distance < 36)
        .sort((a, b) => a.distance - b.distance)[0]?.side ?? null;
      setHoveredHandle((previous) => previous === nextHovered ? previous : nextHovered);
      return;
    }
    if (currentDrag.side === 'scrub') {
      onScrubTime(pos.time);
      return;
    }
    const movementScale = event.ctrlKey || event.metaKey ? 0.1 : 1;
    let time = currentDrag.baseTime + (pos.time - currentDrag.pointerTime) * movementScale;
    let speed = currentDrag.baseSpeed + (pos.speed - currentDrag.pointerSpeed) * movementScale;
    if (event.shiftKey) {
      if (!currentDrag.axisLock && Math.hypot(event.clientX - currentDrag.clientX, event.clientY - currentDrag.clientY) > 4) {
        currentDrag.axisLock = Math.abs(event.clientX - currentDrag.clientX) > Math.abs(event.clientY - currentDrag.clientY) ? 'time' : 'speed';
      }
      if (currentDrag.axisLock === 'time') speed = currentDrag.baseSpeed;
      else if (currentDrag.axisLock === 'speed') time = currentDrag.baseTime;
    }

    const normalizedTime = clamp(time / settings.duration, 0.001, 0.999);
    const snapInfluence = Math.abs(event.clientX - currentDrag.clientX) > 2
      ? [1 / 3, 2 / 3].find((candidate) => Math.abs(normalizedTime - candidate) <= 10 / PLOT_W)
      : undefined;
    if (snapInfluence !== undefined) time = snapInfluence * settings.duration;
    if (Math.abs(speed) <= (plotMax - plotMin) * 8 / PLOT_H) speed = 0;
    onBezierChange(updateBezierFromSpeedHandle(bezier, currentDrag.side, time, speed, settings));
  };

  const endPointer = () => {
    drag.current = null;
    setLockedRange(null);
    setActiveHandle(null);
  };

  const resetHandle = (event: MouseEvent<SVGSVGElement>) => {
    const pos = pointerToGraph(event.currentTarget, event.clientX, event.clientY);
    const hit = handles
      .map((handle) => ({ ...handle, distance: Math.hypot(pos.x - handle.point.x, pos.y - handle.point.y) }))
      .filter(({ distance }) => distance < 36)
      .sort((a, b) => a.distance - b.distance)[0];
    if (!hit || !canEditSpeed) return;
    event.preventDefault();
    onBezierChange(updateBezierFromSpeedHandle(bezier, hit.side, hit.time, averageSpeed, settings));
  };

  return (
    <GraphShell
      title="Speed Graph"
      formula="v(t) · Area = ΔValue (∫v dt)"
      accent="emerald"
      controls={
        <div className="flex items-center gap-3">
          <button type="button" className={`curve-graph-option ${showReticle ? 'is-on' : ''}`} onClick={() => setShowReticle((value) => !value)}><Crosshair className="h-3.5 w-3.5" /> Reticle</button>
          <label className="curve-graph-option"><input type="checkbox" checked={showArea} onChange={(event) => setShowArea(event.target.checked)} /> Area fill</label>
          <span className="hidden rounded border border-emerald-800/40 bg-emerald-950/60 px-2 py-0.5 text-[10px] text-emerald-300 sm:inline">Peak {peakSpeed.toFixed(1)} {settings.unit}/s</span>
        </div>
      }
    >
      <div className="curve-graph-stage">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Interactive speed graph. Drag the start and end handles to edit speed and influence; double-click a handle to reset its speed to average. Hold Shift to lock an axis, Ctrl or Command for fine control. ${canEditSpeed ? '' : 'Speed editing is disabled because start and end values match.'}`}
          className="curve-chart"
          onPointerDown={beginPointer}
          onPointerMove={movePointer}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onLostPointerCapture={endPointer}
          onDoubleClick={resetHandle}
          onPointerLeave={() => {
            if (!drag.current) {
              setHoverPoint(null);
              setHoveredHandle(null);
            }
          }}
        >
          {ticks.map((tick) => {
            const x = PAD_X + tick * PLOT_W;
            const speed = plotMax - tick * (plotMax - plotMin);
            const y = toPoint(0, speed).y;
            return (
              <g key={tick}>
                <path d={`M ${x} ${PAD_Y} V ${HEIGHT - PAD_Y} M ${PAD_X} ${y} H ${WIDTH - PAD_X}`} className="curve-grid" />
                <text x={x} y={HEIGHT - 12} textAnchor="middle" className="curve-tick">{(tick * settings.duration).toFixed(1)}s</text>
                <text x={PAD_X - 9} y={y + 3} textAnchor="end" className="curve-tick">{axisLabel(speed)}</text>
              </g>
            );
          })}
          <path d={`M ${PAD_X} ${PAD_Y} V ${HEIGHT - PAD_Y} H ${WIDTH - PAD_X}`} className="curve-axis" />
          <path d={`M ${PAD_X} ${zeroPoint.y} H ${WIDTH - PAD_X}`} className="curve-zero-line" />
          {showArea && (
            <path
              d={`${curvePath} L ${toPoint(settings.duration, 0).x} ${zeroPoint.y} L ${PAD_X} ${zeroPoint.y} Z`}
              className="curve-speed-area"
            />
          )}
          <path d={curvePath} className="curve-speed-line" />
          <path d={`M ${startPoint.x} ${startPoint.y} H ${startHandle.x} M ${endHandle.x} ${endPoint.y} H ${endPoint.x}`} className="curve-speed-handle-line" />
          <path d={`M ${PAD_X} ${zeroPoint.y} H ${WIDTH - PAD_X}`} className="curve-average-line" />
          <path d={`M ${toPoint(currentTime, 0).x} ${PAD_Y} V ${HEIGHT - PAD_Y}`} className="curve-playhead-line" />
          <circle cx={toPoint(currentTime, currentState.speed).x} cy={toPoint(currentTime, currentState.speed).y} r="5" className="curve-playhead-dot" />
          {handles.map(({ side, point, speed, influence }) => {
            const isHighlighted = activeHandle === side || hoveredHandle === side;
            const labelX = clamp(point.x, PAD_X + 57, WIDTH - PAD_X - 57);
            const labelY = clamp(point.y - 25, PAD_Y + 12, HEIGHT - PAD_Y - 10);
            return (
            <g key={side} data-handle={side} className={isHighlighted ? 'is-highlighted' : ''}>
              <circle cx={point.x} cy={point.y} r="27" className="curve-speed-hit-area" />
              {handleFan > 0 && (
                <path
                  d={`M ${side === 'start' ? startHandle.x : endHandle.x} ${point.y} H ${point.x}`}
                  className="curve-speed-handle-offset"
                />
              )}
              {isHighlighted && <circle cx={point.x} cy={point.y} r="13" className="curve-speed-handle-halo" />}
              <circle cx={point.x} cy={point.y} r={isHighlighted ? 8 : 7} className={`curve-speed-handle curve-speed-handle-${side}`} />
              <path d={`M ${point.x - 3} ${point.y} H ${point.x + 3} M ${point.x} ${point.y - 3} V ${point.y + 3}`} className="curve-handle-cross" />
              {isHighlighted && (
                <g pointerEvents="none">
                  <rect x={labelX - 55} y={labelY - 11} width="110" height="19" rx="5" className="curve-speed-handle-label-bg" />
                  <text x={labelX} y={labelY + 2} textAnchor="middle" className="curve-speed-handle-label">
                    {side === 'start' ? 'OUT' : 'IN'} · {speed.toFixed(1)} · {influence.toFixed(1)}%
                  </text>
                </g>
              )}
            </g>
            );
          })}
          {showReticle && hoverPoint && (
            <g pointerEvents="none">
              <path d={`M ${PAD_X} ${hoverPoint.y} H ${WIDTH - PAD_X} M ${hoverPoint.x} ${PAD_Y} V ${HEIGHT - PAD_Y}`} className="curve-reticle" />
              <text x={clamp(hoverPoint.x + 10, PAD_X + 6, WIDTH - PAD_X - 140)} y={clamp(hoverPoint.y - 10, PAD_Y + 14, HEIGHT - PAD_Y - 8)} className="curve-reticle-text">
                {hoverPoint.time.toFixed(2)}s · {hoverPoint.speed.toFixed(1)}{settings.unit}/s
              </text>
            </g>
          )}
        </svg>
        <div className="curve-graph-legend">
          <span><i className="bg-emerald-400" /> Speed</span>
          <span>Integrated area: {data.totalArea.toFixed(2)}{settings.unit}</span>
          <span>Target: {(settings.endValue - settings.startValue).toFixed(2)}{settings.unit}</span>
          <span>Drag handle for speed + influence · Shift locks axis · Ctrl/⌘ fine · double-click resets</span>
          {!canEditSpeed && <span>Speed handles disabled at zero displacement</span>}
        </div>
      </div>
    </GraphShell>
  );
}

export { ValueGraph, SpeedGraph };
