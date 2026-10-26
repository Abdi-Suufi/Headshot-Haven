import { describe, expect, it } from 'vitest';
import { cmPer360, convertSens, degreesPerCount, verticalFov } from '../lib/sensitivity';
import { formatScore, isBetter, boardKey, allBoards } from '../lib/games';
import { peakCps, percentSlowerThan, stdDev } from '../lib/metrics';
import { gridshotPoints, spidershotPoints, trackingPoints, pickSlot, GRID_SLOTS } from '../games/arena/modes';

describe('sensitivity', () => {
  it('matches known cm/360 values', () => {
    // Valorant 0.4 @ 800 DPI ≈ 40.8 cm, CS2 1.27 @ 800 DPI ≈ 40.9 cm
    expect(cmPer360('valorant', 0.4, 800)).toBeCloseTo(40.82, 1);
    expect(cmPer360('cs2', 1.27, 800)).toBeCloseTo(40.91, 1);
  });

  it('converts between games without changing rotation per count', () => {
    const cs = convertSens('valorant', 0.4, 'cs2');
    expect(cs).toBeCloseTo(1.2727, 3);
    expect(degreesPerCount('cs2', cs)).toBeCloseTo(degreesPerCount('valorant', 0.4), 10);
  });

  it('turns horizontal FOV into vertical FOV', () => {
    expect(verticalFov(90, 1)).toBeCloseTo(90, 6);
    expect(verticalFov(103, 16 / 9)).toBeCloseTo(70.53, 1);
  });
});

describe('games', () => {
  it('orders reaction time ascending and everything else descending', () => {
    expect(isBetter('reaction', 200, 250)).toBe(true);
    expect(isBetter('gridshot', 200, 250)).toBe(false);
    expect(isBetter('cps', 9, null)).toBe(true);
  });

  it('formats scores with units', () => {
    expect(formatScore('reaction', 213.6)).toBe('214 ms');
    expect(formatScore('cps', 9.5)).toBe('9.50 CPS');
    expect(formatScore('gridshot', null)).toBe('—');
  });

  it('lists a board per CPS variant', () => {
    const keys = allBoards().map((b) => boardKey(b.game, b.variant));
    expect(keys).toEqual(['gridshot', 'spidershot', 'tracking', 'reaction', 'cps:5s', 'cps:10s']);
  });
});

describe('arena scoring', () => {
  it('gridshot streak multiplier caps at 2x', () => {
    expect(gridshotPoints(1)).toBe(100);
    expect(gridshotPoints(11)).toBe(150);
    expect(gridshotPoints(21)).toBe(200);
    expect(gridshotPoints(99)).toBe(200);
  });

  it('spidershot rewards fast kills', () => {
    expect(spidershotPoints(200)).toBe(250);
    expect(spidershotPoints(750)).toBe(175);
    expect(spidershotPoints(2000)).toBe(100);
  });

  it('tracking scores 100 points per second on target', () => {
    expect(trackingPoints(45000)).toBe(4500);
  });

  it('never respawns a gridshot target in an occupied or just-vacated slot', () => {
    const occupied = new Set([0, 1, 2]);
    for (let i = 0; i < 200; i++) {
      const slot = pickSlot(occupied, 3);
      expect(slot).toBeGreaterThanOrEqual(0);
      expect(slot).toBeLessThan(GRID_SLOTS.length);
      expect([0, 1, 2, 3]).not.toContain(slot);
    }
  });
});

describe('metrics', () => {
  it('finds the busiest one-second window', () => {
    expect(peakCps([0, 100, 200, 1150, 1200, 1250, 1300, 1400])).toBe(5);
    expect(peakCps([])).toBe(0);
  });

  it('computes sample standard deviation', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
  });

  it('places the median reaction time near the 50th percentile', () => {
    expect(percentSlowerThan(273)).toBeCloseTo(50, 0);
    expect(percentSlowerThan(180)).toBeGreaterThan(90);
    expect(percentSlowerThan(400)).toBeLessThan(5);
  });
});
