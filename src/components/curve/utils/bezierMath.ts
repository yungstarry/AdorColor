import type { AnimationSettings, BezierPoints, AEKeyframeVelocity, SamplePoint } from '../types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function endpointSlope(x1: number, y1: number, x2: number, y2: number): number {
  if (Math.abs(x1) > 1e-8) return y1 / x1;
  if (Math.abs(y1) > 1e-8) return 0;
  if (Math.abs(x2) > 1e-8) return y2 / x2;
  if (Math.abs(y2) > 1e-8) return 0;
  return 1;
}

export function solveBezierParamForX(
  targetX: number,
  x1: number,
  x2: number,
  tolerance = 1e-7,
  maxIterations = 12,
): number {
  if (targetX <= 0) return 0;
  if (targetX >= 1) return 1;

  const sampleX = (t: number) => {
    const u = 1 - t;
    return 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3;
  };
  const derivativeX = (t: number) => {
    const u = 1 - t;
    return 3 * u ** 2 * x1 + 6 * u * t * (x2 - x1) + 3 * t ** 2 * (1 - x2);
  };

  let t = targetX;
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const error = sampleX(t) - targetX;
    if (Math.abs(error) < tolerance) return t;
    const slope = derivativeX(t);
    if (Math.abs(slope) < 1e-8) break;
    const next = t - error / slope;
    if (next < 0 || next > 1) break;
    t = next;
  }

  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 32; iteration += 1) {
    t = (low + high) / 2;
    const x = sampleX(t);
    if (Math.abs(x - targetX) < tolerance) break;
    if (x < targetX) low = t;
    else high = t;
  }
  return t;
}

export function evaluateBezier(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number; dx: number; dy: number; slope: number; d2y_dx2: number } {
  const u = 1 - t;
  const x = 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3;
  const y = 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3;
  const dx = 3 * u ** 2 * x1 + 6 * u * t * (x2 - x1) + 3 * t ** 2 * (1 - x2);
  const dy = 3 * u ** 2 * y1 + 6 * u * t * (y2 - y1) + 3 * t ** 2 * (1 - y2);
  const d2x = 6 * u * (x2 - 2 * x1) + 6 * t * (1 - 2 * x2 + x1);
  const d2y = 6 * u * (y2 - 2 * y1) + 6 * t * (1 - 2 * y2 + y1);

  let slope = 0;
  let secondDerivative = 0;
  if (Math.abs(dx) > 1e-8) {
    slope = dy / dx;
    secondDerivative = (d2y * dx - d2x * dy) / dx ** 3;
  } else if (t <= 0.001) {
    slope = endpointSlope(x1, y1, x2, y2);
  } else if (t >= 0.999) {
    slope = endpointSlope(1 - x2, 1 - y2, 1 - x1, 1 - y1);
  }

  return { x, y, dx, dy, slope, d2y_dx2: secondDerivative };
}

export function getStateAtTime(
  time: number,
  bezier: BezierPoints,
  settings: AnimationSettings,
): SamplePoint {
  const duration = Math.max(settings.duration, 1e-6);
  const clampedTime = clamp(time, 0, duration);
  const normalizedTime = clampedTime / duration;
  const parameter = solveBezierParamForX(normalizedTime, bezier.p1.x, bezier.p2.x);
  const result = evaluateBezier(parameter, bezier.p1.x, bezier.p1.y, bezier.p2.x, bezier.p2.y);
  const delta = settings.endValue - settings.startValue;

  return {
    time: clampedTime,
    frame: clampedTime * settings.fps,
    normalizedTime,
    value: settings.startValue + result.y * delta,
    normalizedValue: result.y,
    speed: delta / duration * result.slope,
    acceleration: delta / duration ** 2 * result.d2y_dx2,
  };
}

export function sampleAnimationCurve(
  bezier: BezierPoints,
  settings: AnimationSettings,
  sampleCount = 120,
): {
  samples: SamplePoint[];
  maxSpeed: number;
  minSpeed: number;
  totalArea: number;
  maxAcceleration: number;
} {
  const count = Math.max(2, Math.floor(sampleCount));
  const samples = Array.from({ length: count }, (_, index) =>
    getStateAtTime((index / (count - 1)) * settings.duration, bezier, settings));
  let maxSpeed = Math.max(...samples.map(({ speed }) => speed));
  let minSpeed = Math.min(...samples.map(({ speed }) => speed));
  let maxAcceleration = Math.max(0, ...samples.map(({ acceleration }) => Math.abs(acceleration)));
  const totalArea = settings.endValue - settings.startValue;
  if (!Number.isFinite(maxSpeed)) maxSpeed = 0;
  if (!Number.isFinite(minSpeed)) minSpeed = 0;
  if (!Number.isFinite(maxAcceleration)) maxAcceleration = 0;

  return { samples, maxSpeed, minSpeed, totalArea, maxAcceleration };
}

export function sampleBezierSpeedCurve(
  bezier: BezierPoints,
  settings: AnimationSettings,
  sampleSteps = 96,
): {
  samples: Array<{ time: number; slope: number; normalizedSpeed: number; speed: number }>;
  peakSlope: number;
} {
  const steps = Math.max(1, Math.floor(sampleSteps));
  const duration = Math.max(settings.duration, 1e-6);
  const x1 = clamp(bezier.p1.x, 0.001, 0.999);
  const x2 = clamp(bezier.p2.x, 0.001, 0.999);
  const rawSamples = Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const result = evaluateBezier(t, x1, bezier.p1.y, x2, bezier.p2.y);
    const slope = result.dy / Math.max(1e-6, result.dx);

    return { time: result.x * duration, slope };
  });
  const peakSlope = Math.max(...rawSamples.map(({ slope }) => slope)) || 1;
  const averageSpeed = (settings.endValue - settings.startValue) / duration;

  return {
    samples: rawSamples.map(({ time, slope }) => ({
      time,
      slope,
      normalizedSpeed: slope / peakSlope,
      speed: slope * averageSpeed,
    })),
    peakSlope,
  };
}

export function bezierToAEVelocity(
  bezier: BezierPoints,
  settings: AnimationSettings,
): AEKeyframeVelocity {
  const delta = settings.endValue - settings.startValue;
  const averageSpeed = delta / Math.max(settings.duration, 1e-6);
  if (Math.abs(delta) < 1e-8) {
    return {
      outgoingInfluence: clamp(bezier.p1.x * 100, 0.1, 100),
      outgoingSpeed: 0,
      incomingInfluence: clamp((1 - bezier.p2.x) * 100, 0.1, 100),
      incomingSpeed: 0,
    };
  }

  return {
    outgoingInfluence: clamp(bezier.p1.x * 100, 0.1, 100),
    outgoingSpeed: bezier.p1.x > 1e-8 ? bezier.p1.y / bezier.p1.x * averageSpeed : 0,
    incomingInfluence: clamp((1 - bezier.p2.x) * 100, 0.1, 100),
    incomingSpeed: 1 - bezier.p2.x > 1e-8
      ? (1 - bezier.p2.y) / (1 - bezier.p2.x) * averageSpeed
      : 0,
  };
}

export function aEVelocityToBezier(
  velocity: AEKeyframeVelocity,
  settings: AnimationSettings,
): BezierPoints {
  const delta = settings.endValue - settings.startValue;
  const averageSpeed = delta / Math.max(settings.duration, 1e-6);
  const x1 = clamp(velocity.outgoingInfluence / 100, 0.001, 0.999);
  const x2 = clamp(1 - velocity.incomingInfluence / 100, 0.001, 0.999);
  const canRepresentVelocity = Math.abs(delta) >= 1e-8 && Math.abs(averageSpeed) >= 1e-8;
  const y1 = canRepresentVelocity ? x1 * velocity.outgoingSpeed / averageSpeed : 0;
  const y2 = canRepresentVelocity ? 1 - (1 - x2) * velocity.incomingSpeed / averageSpeed : 1;

  return {
    p0: { x: 0, y: 0 },
    p1: { x: Number(x1.toFixed(4)), y: Number(y1.toFixed(4)) },
    p2: { x: Number(x2.toFixed(4)), y: Number(y2.toFixed(4)) },
    p3: { x: 1, y: 1 },
  };
}

export function updateBezierFromSpeedHandle(
  bezier: BezierPoints,
  side: 'start' | 'end',
  time: number,
  speed: number,
  settings: AnimationSettings,
): BezierPoints {
  const delta = settings.endValue - settings.startValue;
  const duration = Math.max(settings.duration, 1e-6);
  const averageSpeed = delta / duration;
  if (Math.abs(delta) < 1e-8 || Math.abs(averageSpeed) < 1e-8) return bezier;
  const x = clamp(time / duration, 0.001, 0.999);
  const normalizedSlope = speed / averageSpeed;

  if (side === 'start') {
    return { ...bezier, p1: { x, y: x * normalizedSlope } };
  }
  return { ...bezier, p2: { x, y: 1 - (1 - x) * normalizedSlope } };
}

export function updateBezierSpeedInfluence(
  bezier: BezierPoints,
  side: 'start' | 'end',
  graphX: number,
): BezierPoints {
  const x = clamp(graphX, 0, 1);
  if (side === 'start') {
    return { ...bezier, p1: { ...bezier.p1, x: Number(clamp(2 * x, 0.001, 1).toFixed(4)) } };
  }
  return { ...bezier, p2: { ...bezier.p2, x: Number(clamp(2 * x - 1, 0, 0.999).toFixed(4)) } };
}

export function formatCSSBezier(bezier: BezierPoints): string {
  return `cubic-bezier(${bezier.p1.x.toFixed(3)}, ${bezier.p1.y.toFixed(3)}, ${bezier.p2.x.toFixed(3)}, ${bezier.p2.y.toFixed(3)})`;
}

export function generateExportCode(
  format: string,
  bezier: BezierPoints,
  settings: AnimationSettings,
  samples: SamplePoint[],
): string {
  const { startValue, endValue, duration, unit, fps } = settings;
  const css = formatCSSBezier(bezier);
  const { p1, p2 } = bezier;
  const ae = bezierToAEVelocity(bezier, settings);

  switch (format) {
    case 'css':
      return `/* CSS transition */\n.element {\n  transition: transform ${duration}s ${css};\n}`;
    case 'cssKeyframes':
      return `@keyframes curveMotion {\n${Array.from({ length: 11 }, (_, index) => {
        const percent = index * 10;
        const state = getStateAtTime(duration * percent / 100, bezier, settings);
        return `  ${percent}% { transform: translateX(${state.value.toFixed(2)}${unit}); }`;
      }).join('\n')}\n}\n\n.element {\n  animation: curveMotion ${duration}s linear infinite;\n}`;
    case 'tailwind':
      return `// tailwind.config.js\ntheme: {\n  extend: {\n    transitionTimingFunction: {\n      'custom-curve': '${css}',\n    },\n    transitionDuration: {\n      'anim': '${duration * 1000}ms',\n    },\n  },\n}\n\n<div className=\"transition-transform duration-[${duration}s] ease-[${css}]\">Animated item</div>`;
    case 'waapi':
      return `const element = document.querySelector('.target');\n\nelement.animate([\n  { transform: 'translateX(${startValue}${unit})' },\n  { transform: 'translateX(${endValue}${unit})' },\n], {\n  duration: ${duration * 1000},\n  easing: '${css}',\n  fill: 'forwards',\n});`;
    case 'framer':
      return `import { motion } from 'framer-motion';\n\n<motion.div\n  initial={{ x: ${startValue} }}\n  animate={{ x: ${endValue} }}\n  transition={{ duration: ${duration}, ease: [${p1.x.toFixed(3)}, ${p1.y.toFixed(3)}, ${p2.x.toFixed(3)}, ${p2.y.toFixed(3)}] }}\n/>`;
    case 'gsap':
      return `import { gsap } from 'gsap';\nimport { CustomEase } from 'gsap/CustomEase';\n\ngsap.registerPlugin(CustomEase);\nCustomEase.create('myCurve', '${p1.x.toFixed(3)}, ${p1.y.toFixed(3)}, ${p2.x.toFixed(3)}, ${p2.y.toFixed(3)}');\n\ngsap.to('.target', { x: ${endValue}, duration: ${duration}, ease: 'myCurve' });`;
    case 'ae':
      return `// After Effects keyframe velocity\nvar easeOut = new KeyframeEase(${ae.outgoingSpeed.toFixed(2)}, ${ae.outgoingInfluence.toFixed(1)});\nvar easeIn = new KeyframeEase(${ae.incomingSpeed.toFixed(2)}, ${ae.incomingInfluence.toFixed(1)});\nmyProperty.setTemporalEaseAtKey(1, [new KeyframeEase(0, 50)], [easeOut]);\nmyProperty.setTemporalEaseAtKey(2, [easeIn], [new KeyframeEase(0, 50)]);\n\n// ${ae.outgoingSpeed.toFixed(2)} ${unit}/s → ${ae.incomingSpeed.toFixed(2)} ${unit}/s\n// ${duration}s (${Math.round(duration * fps)} frames @ ${fps} fps)`;
    case 'json':
      return JSON.stringify({
        metadata: {
          converter: 'CurveCraft Animation Curve Converter',
          settings,
          bezier: { p1, p2, css },
          afterEffects: ae,
        },
        samples: samples.map((sample) => ({
          time: Number(sample.time.toFixed(4)),
          frame: Number(sample.frame.toFixed(2)),
          value: Number(sample.value.toFixed(3)),
          speed: Number(sample.speed.toFixed(3)),
          acceleration: Number(sample.acceleration.toFixed(3)),
        })),
      }, null, 2);
    case 'csv':
      return `Time (s),Frame,Value (${unit}),Speed (${unit}/s),Acceleration (${unit}/s^2)\n${samples
        .map((sample) => `${sample.time.toFixed(4)},${sample.frame.toFixed(2)},${sample.value.toFixed(3)},${sample.speed.toFixed(3)},${sample.acceleration.toFixed(3)}`)
        .join('\n')}`;
    default:
      return css;
  }
}
