import type { CakeCondition, CandleState, Position, RectangleBounds } from '../../core/types/identifiers';

export interface FlamePose { readonly visible: boolean; readonly angle: number; readonly scaleX: number; readonly scaleY: number; readonly alpha: number }
export interface CandlePose extends Position { readonly angle: number }

export const CAKE_PART_DEPTH = { cake: 1, damage: 2, candle: 3, flame: 4, smoke: 5 } as const;

export interface CakePartLayoutInput {
  readonly cakeDisplaySize: { readonly width: number; readonly height: number };
  readonly cakeOrigin: Position;
  readonly candleAnchor: Position;
  readonly candleDisplaySize: { readonly width: number; readonly height: number };
  readonly ignitionPadding: Position;
}

export interface CandleIgnitionBoundsInput extends CakePartLayoutInput {
  readonly cakeWorldPosition: Position;
  readonly cakeScale: Position;
}

export function candleLocalCenter(input: CakePartLayoutInput): Position {
  return {
    x: (input.candleAnchor.x - input.cakeOrigin.x) * input.cakeDisplaySize.width,
    y: (input.candleAnchor.y - input.cakeOrigin.y) * input.cakeDisplaySize.height,
  };
}

export function flameBottomAnchor(input: CakePartLayoutInput): Position {
  const candle = candleLocalCenter(input);
  const wickInset = input.candleDisplaySize.height * (9 / 130);
  return { x: candle.x, y: candle.y - input.candleDisplaySize.height / 2 + wickInset };
}

export function candlePoseFor(input: CakePartLayoutInput, condition: CakeCondition): CandlePose {
  const upright = candleLocalCenter(input);
  if (condition === 'damaged') return { x: upright.x + 26, y: upright.y + 22, angle: 78 };
  return { ...upright, angle: 0 };
}

export function resolveCandleIgnitionBounds(input: CandleIgnitionBoundsInput): RectangleBounds {
  const local = candleLocalCenter(input);
  const candleWidth = input.candleDisplaySize.width * Math.abs(input.cakeScale.x);
  const candleHeight = input.candleDisplaySize.height * Math.abs(input.cakeScale.y);
  const center = {
    x: input.cakeWorldPosition.x + local.x * input.cakeScale.x,
    y: input.cakeWorldPosition.y + local.y * input.cakeScale.y,
  };
  return {
    x: center.x - candleWidth / 2 - input.ignitionPadding.x,
    y: center.y - candleHeight / 2 - input.ignitionPadding.y,
    width: candleWidth + input.ignitionPadding.x * 2,
    height: candleHeight + input.ignitionPadding.y * 2,
  };
}

export function flamePoseFor(state: CandleState): FlamePose {
  if (state === 'lighting') return { visible: true, angle: 0, scaleX: 0.45, scaleY: 0.45, alpha: 0.9 };
  if (state === 'lit') return { visible: true, angle: 0, scaleX: 1, scaleY: 1, alpha: 1 };
  if (state === 'flickering') return { visible: true, angle: -24, scaleX: 0.72, scaleY: 1.18, alpha: 0.92 };
  return { visible: false, angle: 0, scaleX: 0.2, scaleY: 0.2, alpha: 0 };
}
