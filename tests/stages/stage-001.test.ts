import { describe, expect, it } from 'vitest';
import { stage001 } from '../../src/content/stages/stage-001';
import { PuzzleEngine } from '../../src/core/engine/PuzzleEngine';

describe('stage-001', () => {
  it('references an existing goal object and unique entity ids', () => {
    const objectIds = stage001.objects.map((object) => object.id);
    const actorIds = stage001.actors.map((actor) => actor.id);
    expect(new Set(objectIds).size).toBe(objectIds.length);
    expect(new Set(actorIds).size).toBe(actorIds.length);
    expect(objectIds).toContain(stage001.goal.objectId);
    expect(stage001.zones.map((zone) => zone.id)).toContain(stage001.goal.zoneId);
  });

  it('places and resets the mat at the named bottom shelf slot', () => {
    const slot = stage001.scene.placements['shelf-bottom-slot'];
    const initialMat = stage001.objects.find((object) => object.id === 'non-slip-mat');
    expect(initialMat?.zoneId).toBe('shelf');
    expect(initialMat?.position).toEqual(slot);

    const engine = new PuzzleEngine(stage001);
    engine.dispatch({
      type: 'DROP_OBJECT',
      objectId: 'non-slip-mat',
      zoneId: 'desk-surface',
      worldPosition: { x: 1200, y: 425 },
    });
    engine.dispatch({ type: 'RESET_STAGE' });

    expect(engine.getState().objects['non-slip-mat'].position).toEqual(slot);
    expect(engine.getState().objects['non-slip-mat'].zoneId).toBe('shelf');
  });
});
