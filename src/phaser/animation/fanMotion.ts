import type { FanDirection, FanPowerState } from '../../core/types/identifiers';

export const FAN_MOTION = {
  poweredDegreesPerSecond: 900,
  headTransitionMs: 520,
} as const;

export interface FanHeadPose {
  readonly x: number;
  readonly angle: number;
  readonly scaleX: number;
}

const HEAD_POSES: Record<FanDirection, FanHeadPose> = {
  away: { x: -7, angle: -4.5, scaleX: 0.95 },
  'turning-toward-desk': { x: -3, angle: -2, scaleX: 0.975 },
  'toward-desk': { x: 7, angle: 4.5, scaleX: 0.95 },
  'turning-away': { x: 3, angle: 2, scaleX: 0.975 },
};

export function getFanHeadPose(direction: FanDirection): FanHeadPose {
  return HEAD_POSES[direction];
}

export function getBladeSpeed(
  power: FanPowerState,
  slowdownRemainingMs: number,
  slowdownDurationMs: number,
): number {
  if (power === 'powered') return FAN_MOTION.poweredDegreesPerSecond;
  if (power === 'stopped') return 0;
  const progress = Math.max(0, Math.min(1, slowdownRemainingMs / slowdownDurationMs));
  return FAN_MOTION.poweredDegreesPerSecond * progress;
}

export function advanceBladeAngle(angle: number, degreesPerSecond: number, deltaMs: number): number {
  const next = angle + degreesPerSecond * (deltaMs / 1000);
  return ((next % 360) + 360) % 360;
}
