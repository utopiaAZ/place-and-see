import { describe, expect, it } from 'vitest';
import { stage002, stage002Placements } from '../../src/content/stages/stage-002';
import { createInitialWorldState } from '../../src/core/engine/WorldState';
import {
  getBottleWeightContactY,
  getFanBaseBottomY,
  getPaperSurfaceY,
  getPlugCableAnchor,
  getPowerCordCurve,
  getStageTwoObjectDepth,
  sampleQuadraticCurve,
} from '../../src/phaser/layout/stageTwoLayout';

describe('Stage 2 render layout', () => {
  it('places the bottle contact point on the paper surface', () => {
    expect(getBottleWeightContactY(stage002Placements['paper-weight']))
      .toBe(getPaperSurfaceY(stage002Placements['document-desk']));
  });

  it('renders paper below its bottle weight', () => {
    const initial = createInitialWorldState(stage002);
    const paper = { ...initial.objects.document, zoneId: 'document-desk' as const };
    const bottle = { ...initial.objects.bottle, zoneId: 'paper-weight' as const };
    expect(getStageTwoObjectDepth(bottle)).toBeGreaterThan(getStageTwoObjectDepth(paper));
  });

  it('places the fan on the named chair-seat contact anchor', () => {
    expect(stage002.scene.stageTwo.fanPosition).toBe(stage002.scene.placements['fan-on-chair']);
    expect(stage002.scene.stageTwo.chairSeatAnchor).toBe(stage002.scene.placements['chair-seat']);
    expect(getFanBaseBottomY(stage002.scene.stageTwo.fanPosition, stage002.scene.stageTwo.fanDisplaySize.height))
      .toBeCloseTo(stage002.scene.stageTwo.chairSeatAnchor.y, 5);
    expect(stage002.scene.stageTwo.fanPosition.x).toBe(stage002.scene.stageTwo.chairSeatAnchor.x);
  });

  it('keeps the cord endpoints attached to the fan base and moving plug', () => {
    const size = stage002.scene.objectVisuals['power-plug'].displaySize;
    const pluggedEnd = getPlugCableAnchor(stage002Placements['plugged-anchor'], size);
    const draggedEnd = getPlugCableAnchor({ x: 780, y: 620 }, size);
    const curve = getPowerCordCurve(stage002.scene.stageTwo.fanBaseCableAnchor, draggedEnd);
    const points = sampleQuadraticCurve(curve);
    expect(points[0]).toEqual(stage002.scene.stageTwo.fanBaseCableAnchor);
    expect(points.at(-1)).toEqual(draggedEnd);
    expect(draggedEnd).not.toEqual(pluggedEnd);
    expect(curve.control.y).toBeGreaterThan(Math.max(curve.start.y, curve.end.y));
  });
});
