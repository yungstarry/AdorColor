export interface BezierPoint {
  x: number;
  y: number;
}

export interface BezierPoints {
  p0: BezierPoint;
  p1: BezierPoint;
  p2: BezierPoint;
  p3: BezierPoint;
}

export interface AnimationSettings {
  startValue: number;
  endValue: number;
  duration: number;
  fps: number;
  unit: string;
}

export interface AEKeyframeVelocity {
  outgoingSpeed: number;
  outgoingInfluence: number;
  incomingSpeed: number;
  incomingInfluence: number;
}

export interface SamplePoint {
  time: number;
  frame: number;
  normalizedTime: number;
  value: number;
  normalizedValue: number;
  speed: number;
  acceleration: number;
}

export interface EasingPreset {
  name: string;
  category: string;
  p1: BezierPoint;
  p2: BezierPoint;
  description: string;
}

export type PreviewMode = 'horizontal' | 'scale' | 'rotation' | 'bounce' | 'opacity';
