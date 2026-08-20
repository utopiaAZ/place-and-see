import { describe, expect, it } from 'vitest';
import { stage003, stage003Placements } from '../../src/content/stages/stage-003';
import { resolveCandleIgnitionBounds } from '../../src/phaser/animation/stageThreeCakeMotion';
import { boundsFromCenter, resolveStageThreeDrop } from '../../src/phaser/input/stageThreeDropResolver';

const layout = stage003.scene.stageThree;
const deskCandleBounds = resolveCandleIgnitionBounds({ ...layout, cakeWorldPosition: stage003Placements['cake-desk'], cakeScale: { x: 1, y: 1 } });
const resolve = (objectId: string, kind: Parameters<typeof resolveStageThreeDrop>[0]['kind'], center: { x: number; y: number }, size: { width: number; height: number }, candleIgnitionBounds = deskCandleBounds) => resolveStageThreeDrop({
  stage: stage003, objectId, kind, objectBounds: boundsFromCenter(center, size), candleIgnitionBounds,
});

describe('Stage 3 drop resolver', () => {
  it('calculates candle world bounds for the desk cake', () => {
    expect(deskCandleBounds).toEqual({ x: 1180, y: 279.5, width: 60, height: 89 });
  });

  it('moves ignition bounds by the same delta as the cake', () => {
    const shelf = resolveCandleIgnitionBounds({ ...layout, cakeWorldPosition: stage003Placements['cake-initial'], cakeScale: { x: 1, y: 1 } });
    expect(deskCandleBounds.x - shelf.x).toBe(stage003Placements['cake-desk'].x - stage003Placements['cake-initial'].x);
    expect(deskCandleBounds.y - shelf.y).toBe(stage003Placements['cake-desk'].y - stage003Placements['cake-initial'].y);
  });

  it('scales ignition bounds with the CakeView root', () => {
    const scaled = resolveCandleIgnitionBounds({ ...layout, cakeWorldPosition: stage003Placements['cake-desk'], cakeScale: { x: 1.1, y: 1.1 } });
    expect(scaled.width).toBe(63); expect(scaled.height).toBe(95.5);
  });

  it('returns ignite-candle when lighter bounds overlap even if its center is outside', () => {
    const result = resolve('lighter', 'lighter', { x: deskCandleBounds.x - 14, y: 330 }, { width: 52, height: 96 });
    expect(result).toEqual({ type: 'ignite-candle', zoneId: 'candle-ignition' });
  });

  it('prioritizes ignition over an overlapping general desk zone', () => {
    const overlappingStage = { ...stage003, zones: stage003.zones.map((zone) => zone.id === 'desk-props' ? { ...zone, bounds: { x: 1160, y: 270, width: 180, height: 160 } } : zone) };
    const result = resolveStageThreeDrop({ stage: overlappingStage, objectId: 'lighter', kind: 'lighter', objectBounds: boundsFromCenter({ x: 1210, y: 325 }, { width: 52, height: 96 }), candleIgnitionBounds: deskCandleBounds });
    expect(result.type).toBe('ignite-candle');
  });

  it('uses a general placement when the lighter is outside candle bounds', () => {
    expect(resolve('lighter', 'lighter', stage003Placements['desk-prop'], { width: 52, height: 96 })).toMatchObject({ type: 'place-object', zoneId: 'desk-props' });
  });

  it('prioritizes the explicit toy zone over the overlapping floor', () => {
    expect(resolve('toy-mouse', 'toy-mouse', stage003Placements['toy-distraction'], { width: 92, height: 58 })).toMatchObject({ type: 'place-object', zoneId: 'toy-distraction-zone' });
  });

  it('rejects a divider outside every valid zone', () => {
    expect(resolve('file-divider', 'file-divider', { x: 800, y: 200 }, { width: 112, height: 108 })).toEqual({ type: 'reject' });
  });
});
