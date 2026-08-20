import { describe, expect, it } from 'vitest';
import { stage001 } from '../../src/content/stages/stage-001';
import { PuzzleEngine } from '../../src/core/engine/PuzzleEngine';
import {
  getBottleVisualBottomY,
  getMatVisualTopY,
  getObjectRenderPose,
  ROOM_DEPTH,
} from '../../src/phaser/layout/roomLayout';
import {
  CAT_BODY_BASE_TRANSFORM,
  getCatBodyTransform,
} from '../../src/phaser/views/CatRig';

const dropOnDesk = (engine: PuzzleEngine, objectId: 'bottle' | 'non-slip-mat') => {
  engine.dispatch({
    type: 'DROP_OBJECT',
    objectId,
    zoneId: 'desk-surface',
    worldPosition: { x: 1200, y: objectId === 'bottle' ? 385 : 425 },
  });
};

describe('Stage 1 render layout', () => {
  it('renders a supported bottle above the mat with matching contact edges', () => {
    const engine = new PuzzleEngine(stage001);
    dropOnDesk(engine, 'non-slip-mat');
    dropOnDesk(engine, 'bottle');
    const state = engine.getState();
    const bottlePose = getObjectRenderPose(state.objects.bottle, stage001.scene);
    const matPose = getObjectRenderPose(state.objects['non-slip-mat'], stage001.scene);

    expect(bottlePose.supportedByMat).toBe(true);
    expect(bottlePose.depth).toBe(ROOM_DEPTH.bottle);
    expect(matPose.depth).toBe(ROOM_DEPTH.supportMat);
    expect(bottlePose.depth).toBeGreaterThan(matPose.depth);
    expect(getBottleVisualBottomY(bottlePose.position))
      .toBeCloseTo(getMatVisualTopY(matPose.position), 0);
  });

  it('releases the mat support render pose as soon as the bottle is picked up', () => {
    const engine = new PuzzleEngine(stage001);
    dropOnDesk(engine, 'non-slip-mat');
    dropOnDesk(engine, 'bottle');
    engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'bottle' });

    const bottle = engine.getState().objects.bottle;
    const pose = getObjectRenderPose(bottle, stage001.scene);
    expect(pose.supportedByMat).toBe(false);
    expect(pose.position).toEqual(bottle.position);
    expect(pose.depth).toBe(ROOM_DEPTH.dragOverlay);
  });

  it('keeps the supported bottle upright through the mat solution', () => {
    const engine = new PuzzleEngine(stage001);
    dropOnDesk(engine, 'non-slip-mat');
    dropOnDesk(engine, 'bottle');
    engine.dispatch({ type: 'ADVANCE_TIME', deltaMs: 2300 });

    expect(engine.getState().objects.bottle.orientation).toBe('upright');
    expect(getObjectRenderPose(engine.getState().objects.bottle, stage001.scene).supportedByMat)
      .toBe(true);
  });
});

describe('cat body runtime transform', () => {
  it('uses animation multipliers relative to the corrected body base transform', () => {
    const prepare = getCatBodyTransform('prepare-jump');
    const jump = getCatBodyTransform('jump-stretch');
    const returned = getCatBodyTransform('base');

    expect(prepare.scaleX).toBeCloseTo(CAT_BODY_BASE_TRANSFORM.scaleX * 1.12);
    expect(prepare.scaleY).toBeCloseTo(CAT_BODY_BASE_TRANSFORM.scaleY * 0.72);
    expect(jump.scaleY).toBeCloseTo(CAT_BODY_BASE_TRANSFORM.scaleY * 1.18);
    expect(returned).toEqual(CAT_BODY_BASE_TRANSFORM);
  });
});
