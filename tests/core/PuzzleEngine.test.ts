import { describe, expect, it } from 'vitest';
import { stage001 } from '../../src/content/stages/stage-001';
import { PuzzleEngine } from '../../src/core/engine/PuzzleEngine';
import { createInitialWorldState } from '../../src/core/engine/WorldState';

const placeBottleOnDesk = (engine: PuzzleEngine) =>
  engine.dispatch({ type: 'MOVE_OBJECT', objectId: 'bottle', position: { x: 560, y: 202 }, location: 'desk' });

describe('PuzzleEngine', () => {
  it('creates the initial world state from stage data', () => {
    const state = createInitialWorldState(stage001);
    expect(state.stageId).toBe('stage-001');
    expect(state.objects.bottle.location).toBe('floor');
    expect(state.goal.stableForMs).toBe(0);
  });

  it('handles a bottle movement command', () => {
    const engine = new PuzzleEngine(stage001);
    const result = engine.dispatch({
      type: 'MOVE_OBJECT', objectId: 'bottle', position: { x: 300, y: 350 }, location: 'floor',
    });
    expect(result.accepted).toBe(true);
    expect(engine.getState().objects.bottle.position).toEqual({ x: 300, y: 350 });
  });

  it('rejects an unknown object without mutating the world', () => {
    const engine = new PuzzleEngine(stage001);
    const before = engine.getState();
    const result = engine.dispatch({
      type: 'MOVE_OBJECT', objectId: 'missing', position: { x: 0, y: 0 }, location: 'floor',
    });
    expect(result.accepted).toBe(false);
    expect(engine.getState()).toEqual(before);
  });

  it('changes the bottle location when placed on the desk', () => {
    const engine = new PuzzleEngine(stage001);
    placeBottleOnDesk(engine);
    expect(engine.getState().objects.bottle.location).toBe('desk');
    expect(engine.getState().goal.active).toBe(true);
  });

  it('resets the stage to a fresh state', () => {
    const engine = new PuzzleEngine(stage001);
    placeBottleOnDesk(engine);
    engine.dispatch({ type: 'ADVANCE_TIME', deltaMs: 1000 });
    engine.reset();
    expect(engine.getState()).toEqual(createInitialWorldState(stage001));
  });

  it('does not complete before the stability duration', () => {
    const engine = new PuzzleEngine(stage001);
    placeBottleOnDesk(engine);
    engine.dispatch({ type: 'ADVANCE_TIME', deltaMs: 2999 });
    expect(engine.getState().goal.completed).toBe(false);
  });

  it('completes when the stability duration is met', () => {
    const engine = new PuzzleEngine(stage001);
    placeBottleOnDesk(engine);
    engine.dispatch({ type: 'ADVANCE_TIME', deltaMs: 3000 });
    expect(engine.getState().goal.completed).toBe(true);
  });

  it('resets stability progress when the target state breaks', () => {
    const engine = new PuzzleEngine(stage001);
    placeBottleOnDesk(engine);
    engine.dispatch({ type: 'ADVANCE_TIME', deltaMs: 1800 });
    engine.dispatch({ type: 'MOVE_OBJECT', objectId: 'bottle', position: { x: 200, y: 390 }, location: 'floor' });
    expect(engine.getState().goal.stableForMs).toBe(0);
    expect(engine.getState().goal.active).toBe(false);
  });
});
