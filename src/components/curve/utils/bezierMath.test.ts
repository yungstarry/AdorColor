import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aEVelocityToBezier,
  bezierToAEVelocity,
  getStateAtTime,
  sampleAnimationCurve,
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
