import { describe, expect, it } from 'vitest';
import { advanceBladeAngle, FAN_MOTION, getBladeSpeed, getFanHeadPose } from '../../src/phaser/animation/fanMotion';

describe('Stage 2 fan visual motion', () => {
  it('advances powered blades at a frame-rate independent speed and wraps at 360 degrees', () => {
    const oneLargeStep = advanceBladeAngle(350, FAN_MOTION.poweredDegreesPerSecond, 1000);
    let smallSteps = 350;
    for (let index = 0; index < 20; index += 1) smallSteps = advanceBladeAngle(smallSteps, FAN_MOTION.poweredDegreesPerSecond, 50);
    expect(oneLargeStep).toBeCloseTo(170, 5);
    expect(smallSteps).toBeCloseTo(oneLargeStep, 5);
    expect(oneLargeStep).toBeGreaterThanOrEqual(0);
    expect(oneLargeStep).toBeLessThan(360);
  });

  it('reduces blade speed continuously during the 600ms slowdown and preserves stopped angle', () => {
    expect(getBladeSpeed('powered', 600, 600)).toBe(900);
    expect(getBladeSpeed('slowing-down', 600, 600)).toBe(900);
    expect(getBladeSpeed('slowing-down', 300, 600)).toBe(450);
    expect(getBladeSpeed('slowing-down', 0, 600)).toBe(0);
    expect(getBladeSpeed('stopped', 0, 600)).toBe(0);
    expect(advanceBladeAngle(137, 0, 1000)).toBe(137);
  });

  it('uses subtle head poses independently of blade rotation', () => {
    const away = getFanHeadPose('away');
    const toward = getFanHeadPose('toward-desk');
    expect(Math.abs(away.angle)).toBeLessThanOrEqual(6);
    expect(Math.abs(toward.angle)).toBeLessThanOrEqual(6);
    expect(away.x).toBeLessThan(0);
    expect(toward.x).toBeGreaterThan(0);
    expect(away.scaleX).toBeGreaterThanOrEqual(0.94);
  });
});
