import { describe, expect, it } from 'vitest';
import { stage001 } from '../../src/content/stages/stage-001';

describe('stage-001', () => {
  it('references an existing goal object and unique entity ids', () => {
    const objectIds = stage001.objects.map((object) => object.id);
    const actorIds = stage001.actors.map((actor) => actor.id);
    expect(new Set(objectIds).size).toBe(objectIds.length);
    expect(new Set(actorIds).size).toBe(actorIds.length);
    expect(objectIds).toContain(stage001.goal.objectId);
  });
});
