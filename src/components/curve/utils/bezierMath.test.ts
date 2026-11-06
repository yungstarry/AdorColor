import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aEVelocityToBezier,
  bezierToAEVelocity,
  getStateAtTime,
  sampleBezierSpeedCurve,
  sampleAnimationCurve,
  updateBezierSpeedInfluence,
  updateBezierFromSpeedHandle,
} from './bezierMath';
import { ALL_EASING_PRESETS, EASING_CATEGORIES } from './presets';
import type { AnimationSettings, BezierPoints } from '../types';

const settings: AnimationSettings = {
  startValue: 10,
  endValue: 110,
  duration: 2,
  fps: 30,
  unit: 'px',
};

const curve: BezierPoints = {
  p0: { x: 0, y: 0 },
  p1: { x: 0.25, y: 0.1 },
  p2: { x: 0.75, y: 0.9 },
  p3: { x: 1, y: 1 },
};

test('preset catalog has no Reach entries or category', () => {
  assert.ok(ALL_EASING_PRESETS.every(({ category, name }) =>
    category !== 'Reach' && !name.startsWith('Reach Pro')));
  assert.ok(!EASING_CATEGORIES.includes('Reach'));
});

test("Adordev's presets are categorized and restricted to speed previews", () => {
  const adordevPresets = ALL_EASING_PRESETS.filter(({ category }) => category === "Adordev's Presets");
  const speedPresets = adordevPresets.filter(({ previewMode }) => previewMode === 'speed');
  assert.deepEqual(speedPresets.map(({ name, p1, p2, previewMode }) => [
    name, p1.x, p1.y, p2.x, p2.y, previewMode,
  ]), [
    ['1', 0.5, 0, 0.5, 1, 'speed'],
    ['2', 0.75, 0, 0.25, 1, 'speed'],
    ['3', 1, 0, 0, 1, 'speed'],
    ['4', 0, 0, 0, 1, 'speed'],
    ['5', 0.25, 0, 0, 1, 'speed'],
    ['6', 1, 0, 1, 1, 'speed'],
    ['7', 1, 0, 0.75, 1, 'speed'],
  ]);
  assert.deepEqual(adordevPresets.slice(7).map(({ name, p1, p2, previewMode }) => [
    name, p1.x, p1.y, p2.x, p2.y, previewMode,
  ]), [
    ['Linear 8', 0, 0, 1, 1, 'both'],
    ['Easy Ease 9', 1 / 3, 0, 2 / 3, 1, 'both'],
    ['Ease In 10', 0.42, 0, 1, 1, 'both'],
    ['Ease Out 11', 0, 0, 0.58, 1, 'both'],
    ['Ease In Out 12', 0.42, 0, 0.58, 1, 'both'],
    ['Sine In 13', 0.12, 0, 0.39, 0, 'both'],
    ['Sine Out 14', 0.61, 1, 0.88, 1, 'both'],
    ['Sine In Out 15', 0.37, 0, 0.63, 1, 'both'],
    ['Quad In 16', 0.11, 0, 0.5, 0, 'both'],
    ['Quad Out 17', 0.5, 1, 0.89, 1, 'both'],
    ['Quad In Out 18', 0.45, 0, 0.55, 1, 'both'],
    ['Cubic In 19', 0.32, 0, 0.67, 0, 'both'],
    ['Cubic Out 20', 0.33, 1, 0.68, 1, 'both'],
    ['Cubic In Out 21', 0.65, 0, 0.35, 1, 'both'],
    ['Quart In 22', 0.5, 0, 0.75, 0, 'both'],
    ['Quart Out 23', 0.25, 1, 0.5, 1, 'both'],
    ['Quart In Out 24', 0.76, 0, 0.24, 1, 'both'],
    ['Quint In 25', 0.64, 0, 0.78, 0, 'both'],
    ['Quint Out 26', 0.22, 1, 0.36, 1, 'both'],
    ['Quint In Out 27', 0.83, 0, 0.17, 1, 'both'],
    ['Expo In 28', 0.7, 0, 0.84, 0, 'both'],
    ['Expo Out 29', 0.16, 1, 0.3, 1, 'both'],
    ['Expo In Out 30', 0.87, 0, 0.13, 1, 'both'],
    ['Circ In 31', 0.55, 0, 1, 0.45, 'both'],
    ['Circ Out 32', 0, 0.55, 0.45, 1, 'both'],
  ]);
  assert.ok(EASING_CATEGORIES.includes("Adordev's Presets"));
});

test('Bezier endpoint tangents reproduce requested start and end speeds', () => {
  const startSpeed = getStateAtTime(0, curve, settings).speed;
  const endSpeed = getStateAtTime(settings.duration, curve, settings).speed;
  assert.ok(Math.abs(startSpeed - 20) < 1e-8);
  assert.ok(Math.abs(endSpeed - 20) < 1e-8);
});

test('edge-aligned ease presets have continuous finite endpoint speeds', () => {
  const easeOut: BezierPoints = {
    p0: { x: 0, y: 0 },
    p1: { x: 0, y: 0 },
    p2: { x: 0.58, y: 1 },
    p3: { x: 1, y: 1 },
  };
  const easeIn: BezierPoints = {
    p0: { x: 0, y: 0 },
    p1: { x: 0.42, y: 0 },
    p2: { x: 1, y: 1 },
    p3: { x: 1, y: 1 },
  };
  const easeOutSamples = sampleAnimationCurve(easeOut, settings, 160).samples;
  const easeInSamples = sampleAnimationCurve(easeIn, settings, 160).samples;

  assert.ok(Math.abs(easeOutSamples[0].speed - easeOutSamples[1].speed) < 5);
  assert.ok(Math.abs(easeInSamples.at(-1)!.speed - easeInSamples.at(-2)!.speed) < 5);
});

test('speed graph samples the parametric derivative densely and stays in sync with value speed', () => {
  const { samples, peakSlope } = sampleBezierSpeedCurve(curve, settings);
  assert.equal(samples.length, 97);
  assert.equal(samples[0].time, 0);
  assert.equal(samples.at(-1)!.time, settings.duration);

  for (const sample of samples.filter((_, index) => index % 51 === 0)) {
    const valueSpeed = getStateAtTime(sample.time, curve, settings).speed;
    assert.ok(Math.abs(sample.speed - valueSpeed) < 1e-4);
    assert.ok(Math.abs(sample.normalizedSpeed - sample.slope / peakSlope) < 1e-12);
  }
  assert.ok(samples.every(({ time, speed }) => Number.isFinite(time) && Number.isFinite(speed)));
});

test('speed graph clamps endpoint x handles and normalizes against the positive peak', () => {
  const edgeCurve: BezierPoints = {
    p0: { x: 0, y: 0 },
    p1: { x: 0, y: 0.3 },
    p2: { x: 1, y: 0.8 },
    p3: { x: 1, y: 1 },
  };
  const { samples, peakSlope } = sampleBezierSpeedCurve(edgeCurve, settings);
  const expectedStartSlope = edgeCurve.p1.y / 0.001;

  assert.ok(Math.abs(samples[0].slope - expectedStartSlope) < 1e-8);
  assert.equal(Math.max(...samples.map(({ normalizedSpeed }) => normalizedSpeed)), 1);
  assert.equal(samples[0].speed, samples[0].slope * 50);
  assert.ok(Number.isFinite(peakSlope));
});

test('speed graph handles map horizontal positions to influence without changing tangent speeds', () => {
  const startUpdated = updateBezierSpeedInfluence(curve, 'start', 0.25);
  assert.equal(startUpdated.p1.x, 0.5);
  assert.equal(startUpdated.p1.y, curve.p1.y);
  assert.deepEqual(startUpdated.p2, curve.p2);

  const endUpdated = updateBezierSpeedInfluence(curve, 'end', 0.75);
  assert.equal(endUpdated.p2.x, 0.5);
  assert.equal(endUpdated.p2.y, curve.p2.y);
  assert.deepEqual(endUpdated.p1, curve.p1);
});

test('After Effects velocity conversion round-trips signed speeds and influences', () => {
  const velocity = bezierToAEVelocity(curve, settings);
  const restored = aEVelocityToBezier(velocity, settings);
  assert.ok(Math.abs(restored.p1.x - curve.p1.x) < 1e-4);
  assert.ok(Math.abs(restored.p1.y - curve.p1.y) < 1e-4);
  assert.ok(Math.abs(restored.p2.x - curve.p2.x) < 1e-4);
  assert.ok(Math.abs(restored.p2.y - curve.p2.y) < 1e-4);

  const reversed = { ...settings, startValue: 110, endValue: 10 };
  const reversedVelocity = bezierToAEVelocity(curve, reversed);
  assert.ok(reversedVelocity.outgoingSpeed < 0);
  assert.ok(reversedVelocity.incomingSpeed < 0);
  const restoredReversed = aEVelocityToBezier(reversedVelocity, reversed);
  assert.ok(Math.abs(restoredReversed.p1.y - curve.p1.y) < 1e-4);
  assert.ok(Math.abs(restoredReversed.p2.y - curve.p2.y) < 1e-4);
});

test('zero displacement produces finite zero velocities', () => {
  const zeroDelta = { ...settings, endValue: settings.startValue };
  const velocity = bezierToAEVelocity(curve, zeroDelta);
  assert.equal(velocity.outgoingSpeed, 0);
  assert.equal(velocity.incomingSpeed, 0);
  assert.equal(updateBezierFromSpeedHandle(curve, 'start', 1, 50, zeroDelta), curve);
});

test('speed handles directly control endpoint speed and influence', () => {
  const startUpdated = updateBezierFromSpeedHandle(curve, 'start', 1.2, -9.4, settings);
  assert.equal(startUpdated.p1.x, 0.6);
  assert.ok(Math.abs(getStateAtTime(0, startUpdated, settings).speed - -9.4) < 1e-8);
  assert.deepEqual(startUpdated.p2, curve.p2);

  const endUpdated = updateBezierFromSpeedHandle(curve, 'end', 1.3, 12, settings);
  assert.equal(endUpdated.p2.x, 0.65);
  assert.ok(Math.abs(getStateAtTime(settings.duration, endUpdated, settings).speed - 12) < 1e-8);
  assert.deepEqual(endUpdated.p1, curve.p1);
});

test('speed handle edits preserve endpoint values and signed-speed behavior', () => {
  const reversed = { ...settings, startValue: 110, endValue: 10 };
  const updated = updateBezierFromSpeedHandle(curve, 'start', 0.8, 15, reversed);
  assert.ok(Math.abs(getStateAtTime(0, updated, reversed).speed - 15) < 1e-8);
  assert.equal(getStateAtTime(0, updated, reversed).value, reversed.startValue);
  assert.equal(getStateAtTime(reversed.duration, updated, reversed).value, reversed.endValue);
});

test('integrated speed area exactly matches the endpoint value change', () => {
  const updated = updateBezierFromSpeedHandle(curve, 'start', 0.8, -9.4, settings);
  assert.equal(sampleAnimationCurve(updated, settings, 20).totalArea, settings.endValue - settings.startValue);
});
