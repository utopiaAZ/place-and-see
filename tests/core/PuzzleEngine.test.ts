import { describe, expect, it, vi } from 'vitest';
import { stage001 } from '../../src/content/stages/stage-001';
import { PuzzleEngine } from '../../src/core/engine/PuzzleEngine';
import { createInitialWorldState } from '../../src/core/engine/WorldState';
import type { ZoneId } from '../../src/core/types/identifiers';

const positions = {
  floor: { x: 520, y: 700 }, shelf: { x: 200, y: 430 }, 'desk-surface': { x: 1200, y: 350 },
} as const;
const drop = (engine: PuzzleEngine, objectId: string, zoneId: ZoneId, position = positions[zoneId as keyof typeof positions]) =>
  engine.dispatch({ type: 'DROP_OBJECT', objectId, zoneId, worldPosition: position });
const advance = (engine: PuzzleEngine, totalMs: number, stepMs = totalMs) => {
  let remaining = totalMs;
  while (remaining > 0) {
    const deltaMs = Math.min(stepMs, remaining);
    engine.dispatch({ type: 'ADVANCE_TIME', deltaMs });
    remaining -= deltaMs;
  }
};

describe('Stage 1 PuzzleEngine', () => {
  it('1. is not completed initially', () => {
    const state = new PuzzleEngine(stage001).getState();
    expect(state.progressState).toBe('playing');
    expect(state.goal.completed).toBe(false);
  });
  it('2. starts stability when the bottle is placed on the desk', () => {
    const engine = new PuzzleEngine(stage001);
    expect(drop(engine, 'bottle', 'desk-surface').accepted).toBe(true);
    expect(engine.getState().goal.active).toBe(true);
    expect(engine.getState().progressState).toBe('stabilizing');
  });
  it('3. lets the cat knock over an unprotected bottle before three seconds', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 2200);
    expect(engine.getState().objects.bottle.orientation).toBe('fallen');
    expect(engine.getState().goal.completed).toBe(false);
    expect(engine.getState().elapsedMs).toBeLessThan(3000);
  });
  it('4. resets stability when the bottle starts wobbling', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 1700);
    expect(engine.getState().objects.bottle.orientation).toBe('wobbling');
    expect(engine.getState().goal.stableForMs).toBe(0);
  });
  it('5. keeps the cat focused on food instead of the bottle', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'cat-food', 'floor'); drop(engine, 'bottle', 'desk-surface'); advance(engine, 2000);
    expect(engine.getState().actors.cat.behavior).toBe('distracted-by-food');
    expect(engine.getState().objects.bottle.orientation).toBe('upright');
  });
  it('6. completes the stage with the food solution', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'cat-food', 'floor'); drop(engine, 'bottle', 'desk-surface'); advance(engine, 3000);
    expect(engine.getState().progressState).toBe('completed');
  });
  it('7. distracts the cat with the toy for five seconds', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'toy-mouse', 'floor'); advance(engine, 4999);
    expect(engine.getState().actors.cat.behavior).toBe('playing-with-toy');
    expect(engine.getState().objects['toy-mouse'].inputLocked).toBe(true);
  });
  it('8. completes within the toy distraction window', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'toy-mouse', 'floor'); drop(engine, 'bottle', 'desk-surface'); advance(engine, 3000);
    expect(engine.getState().progressState).toBe('completed');
  });
  it('9. notices a bottle again after toy play and return finish', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'toy-mouse', 'floor'); advance(engine, 5600);
    expect(engine.getState().actors.cat.behavior).toBe('idle');
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 250);
    expect(engine.getState().actors.cat.behavior).toBe('noticing-bottle');
  });
  it('10. makes an unsupported bottle wobble after the cat tap', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 1700);
    expect(engine.getState().objects.bottle.orientation).toBe('wobbling');
  });
  it('11. keeps a mat-supported bottle upright after the cat tap', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'non-slip-mat', 'desk-surface'); drop(engine, 'bottle', 'desk-surface'); advance(engine, 1700);
    expect(engine.getState().objects.bottle.orientation).toBe('upright');
    expect(engine.getState().objects.bottle.isSupportedByMat).toBe(true);
  });
  it('12. completes the stage with the mat solution', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'non-slip-mat', 'desk-surface'); drop(engine, 'bottle', 'desk-surface'); advance(engine, 3000);
    expect(engine.getState().progressState).toBe('completed');
  });
  it('13. cancels a noticing attack when food is placed', () => {
    const engine = new PuzzleEngine(stage001); const listener = vi.fn(); engine.subscribe(listener);
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 300);
    expect(engine.getState().actors.cat.behavior).toBe('noticing-bottle');
    drop(engine, 'cat-food', 'floor');
    expect(engine.getState().actors.cat.behavior).toBe('distracted-by-food');
    expect(listener).toHaveBeenCalledWith({ type: 'CAT_ATTACK_CANCELLED' });
  });
  it('14. cancels a preparing attack when the toy is placed', () => {
    const engine = new PuzzleEngine(stage001); const listener = vi.fn(); engine.subscribe(listener);
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 700);
    expect(engine.getState().actors.cat.behavior).toBe('preparing-jump');
    drop(engine, 'toy-mouse', 'floor');
    expect(engine.getState().actors.cat.behavior).toBe('playing-with-toy');
    expect(listener).toHaveBeenCalledWith({ type: 'CAT_ATTACK_CANCELLED' });
  });
  it('15. does not cancel a jump already in progress', () => {
    const engine = new PuzzleEngine(stage001); const events: string[] = [];
    engine.subscribe((event) => events.push(event.type));
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 1100);
    expect(engine.getState().actors.cat.behavior).toBe('jumping'); events.length = 0;
    drop(engine, 'cat-food', 'floor');
    expect(engine.getState().actors.cat.behavior).toBe('jumping');
    expect(engine.getState().actors.cat.pendingDistraction).toBe('cat-food');
    expect(events).not.toContain('CAT_ATTACK_CANCELLED');
  });
  it('16. locks a mat while it supports the desk bottle', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'non-slip-mat', 'desk-surface'); drop(engine, 'bottle', 'desk-surface');
    expect(engine.getState().objects['non-slip-mat'].inputLocked).toBe(true);
    expect(engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'non-slip-mat' }).accepted).toBe(false);
  });
  it('17. locks food and toy while the cat is using them', () => {
    const foodEngine = new PuzzleEngine(stage001); drop(foodEngine, 'cat-food', 'floor');
    expect(foodEngine.getState().objects['cat-food'].inputLocked).toBe(true);
    const toyEngine = new PuzzleEngine(stage001); drop(toyEngine, 'toy-mouse', 'floor');
    expect(toyEngine.getState().objects['toy-mouse'].inputLocked).toBe(true);
  });
  it('18. resets all state and virtual time through RESET_STAGE', () => {
    const engine = new PuzzleEngine(stage001);
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 2200); engine.dispatch({ type: 'RESET_STAGE' });
    expect(engine.getState()).toEqual(createInitialWorldState(stage001));
  });
  it('19. emits STAGE_COMPLETED exactly once', () => {
    const engine = new PuzzleEngine(stage001); const events: string[] = [];
    engine.subscribe((event) => events.push(event.type));
    drop(engine, 'cat-food', 'floor'); drop(engine, 'bottle', 'desk-surface'); advance(engine, 6000); advance(engine, 1000);
    expect(events.filter((type) => type === 'STAGE_COMPLETED')).toHaveLength(1);
  });
  it('20. produces the same result with large and small virtual-time steps', () => {
    const large = new PuzzleEngine(stage001); const small = new PuzzleEngine(stage001);
    drop(large, 'bottle', 'desk-surface'); drop(small, 'bottle', 'desk-surface');
    advance(large, 2200); advance(small, 2200, 100);
    expect(large.getState()).toEqual(small.getState());
  });
  it('rejects an unknown object without changing state', () => {
    const engine = new PuzzleEngine(stage001); const before = engine.getState();
    expect(drop(engine, 'missing', 'floor').accepted).toBe(false);
    expect(engine.getState()).toEqual(before);
  });
  it('emits CAT_LANDED once at the jump boundary', () => {
    const engine = new PuzzleEngine(stage001); const events: string[] = [];
    engine.subscribe((event) => events.push(event.type));
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 1600);
    expect(events.filter((type) => type === 'CAT_LANDED')).toHaveLength(1);
  });
  it('emits WATER_SPILLED once when the spill state is created', () => {
    const engine = new PuzzleEngine(stage001); const events: string[] = [];
    engine.subscribe((event) => events.push(event.type));
    drop(engine, 'bottle', 'desk-surface'); advance(engine, 2200);
    expect(events.filter((type) => type === 'WATER_SPILLED')).toHaveLength(1);
    expect(events.indexOf('BOTTLE_FELL')).toBeLessThan(events.indexOf('WATER_SPILLED'));
  });
  it('emits OBJECT_DROP_REJECTED without changing state', () => {
    const engine = new PuzzleEngine(stage001); const events: string[] = []; const before = engine.getState();
    engine.subscribe((event) => events.push(event.type));
    engine.dispatch({ type: 'REPORT_INVALID_DROP', objectId: 'bottle' });
    expect(engine.getState()).toEqual(before);
    expect(events.filter((type) => type === 'OBJECT_DROP_REJECTED')).toHaveLength(1);
  });
});
