import { describe, expect, it, vi } from 'vitest';
import { stage003, stage003Placements } from '../../src/content/stages/stage-003';
import { PuzzleEngine } from '../../src/core/engine/PuzzleEngine';
import type { GameEvent } from '../../src/core/events/GameEvent';

const positions: Record<string, { x: number; y: number }> = {
  floor: { x: 500, y: 740 }, shelf: { x: 200, y: 450 },
  'cake-desk': stage003Placements['cake-desk'], 'candle-ignition': stage003Placements['candle-anchor'],
  'cat-food-zone': stage003Placements['cat-food'], 'toy-distraction-zone': stage003Placements['toy-distraction'],
  'airflow-blocker': stage003Placements['airflow-blocker'], 'desk-props': stage003Placements['desk-prop'],
  'plug-socket': stage003Placements['plugged-anchor'], 'plug-unplugged': stage003Placements['unplugged-anchor'],
};
const drop = (engine: PuzzleEngine, objectId: string, zoneId: string) => engine.dispatch({ type: 'DROP_OBJECT', objectId, zoneId, worldPosition: positions[zoneId] });
const advance = (engine: PuzzleEngine, totalMs: number, stepMs = totalMs) => { for (let left = totalMs; left > 0;) { const deltaMs = Math.min(stepMs, left); engine.dispatch({ type: 'ADVANCE_TIME', deltaMs }); left -= deltaMs; } };
const unplug = (engine: PuzzleEngine) => { drop(engine, 'power-plug', 'plug-unplugged'); advance(engine, 600); };
const startLighting = (engine: PuzzleEngine) => engine.dispatch({ type: 'LIGHT_CANDLE', lighterId: 'lighter' });
const light = (engine: PuzzleEngine) => { startLighting(engine); advance(engine, 300); };
const cake = (engine: PuzzleEngine) => drop(engine, 'cake', 'cake-desk');
const food = (engine: PuzzleEngine) => drop(engine, 'cat-food', 'cat-food-zone');
const toy = (engine: PuzzleEngine) => drop(engine, 'toy-mouse', 'toy-distraction-zone');
const divider = (engine: PuzzleEngine) => drop(engine, 'file-divider', 'airflow-blocker');

describe('Stage 3 PuzzleEngine', () => {
  it('has the specified initial cake, cat, fan, plug, and candle state', () => {
    const state = new PuzzleEngine(stage003).getState();
    expect(state.stageThree).toMatchObject({ cakeCondition: 'intact', cakeLocation: 'shelf', candleState: 'unlit', catThreat: 'active', fanPower: 'powered', fanDirection: 'away', plugConnected: true, airflowProtection: 'none' });
    expect(state.actors.cat.behavior).toBe('idle'); expect(state.objects.cake.zoneId).toBe('shelf');
  });

  it('emits CAKE_PLACED and starts an active-cat attack', () => {
    const engine = new PuzzleEngine(stage003); const events: string[] = []; engine.subscribe((event) => events.push(event.type));
    cake(engine); expect(events).toContain('CAKE_PLACED'); advance(engine, 250); expect(events).toContain('CAT_NOTICED_CAKE');
  });

  it('damages and drops the cake when the cat reaches it', () => {
    const engine = new PuzzleEngine(stage003); cake(engine); advance(engine, 1500);
    expect(engine.getState().stageThree).toMatchObject({ cakeCondition: 'damaged', cakeLocation: 'floor' });
    expect(engine.getState().objects.cake.position).toEqual(stage003Placements['cake-damaged']);
  });

  it('never completes with a damaged cake', () => {
    const engine = new PuzzleEngine(stage003); cake(engine); advance(engine, 1500); food(engine); unplug(engine); advance(engine, 5000);
    expect(engine.getState().progressState).not.toBe('completed');
  });

  it('food permanently neutralizes the cat', () => {
    const engine = new PuzzleEngine(stage003); food(engine); advance(engine, 8000);
    expect(engine.getState().stageThree?.catThreat).toBe('permanently-distracted'); expect(engine.getState().actors.cat.behavior).toBe('distracted-by-food');
  });

  it('toy neutralizes the cat for exactly five seconds', () => {
    const engine = new PuzzleEngine(stage003); toy(engine); advance(engine, 4999);
    expect(engine.getState().stageThree?.catThreat).toBe('temporarily-distracted'); advance(engine, 1);
    expect(engine.getState().stageThree?.catThreat).toBe('active');
  });

  it('toy expiry resets stability and lets the cat notice the cake again', () => {
    const engine = new PuzzleEngine(stage003); toy(engine); advance(engine, 2500); unplug(engine); cake(engine); light(engine); advance(engine, 1599);
    expect(engine.getState().goal.stableForMs).toBeGreaterThan(0); advance(engine, 1);
    expect(engine.getState().goal.stableForMs).toBe(0); advance(engine, 850); expect(engine.getState().actors.cat.behavior).toBe('noticing-bottle');
  });

  it('blows out a lit candle when powered airflow reaches the desk', () => {
    const engine = new PuzzleEngine(stage003); food(engine); cake(engine); light(engine); advance(engine, 1150);
    expect(engine.getState().stageThree?.candleState).toBe('extinguished'); expect(engine.getState().status).toBe('candle-blown-out');
  });

  it('does not treat the fan momentarily pointing away as structural protection', () => {
    const engine = new PuzzleEngine(stage003); food(engine); cake(engine); light(engine);
    expect(engine.getState().stageThree?.fanDirection).toBe('away'); expect(engine.getState().stageThree?.airflowProtection).toBe('none'); advance(engine, 3000);
    expect(engine.getState().progressState).not.toBe('completed');
  });

  it('does not grant fan-stopped protection before the 600ms boundary', () => {
    const engine = new PuzzleEngine(stage003); drop(engine, 'power-plug', 'plug-unplugged'); advance(engine, 599);
    expect(engine.getState().stageThree).toMatchObject({ fanPower: 'slowing-down', airflowProtection: 'none' });
  });

  it('grants fan-stopped protection exactly at 600ms', () => {
    const engine = new PuzzleEngine(stage003); drop(engine, 'power-plug', 'plug-unplugged'); advance(engine, 600);
    expect(engine.getState().stageThree).toMatchObject({ fanPower: 'stopped', airflowProtection: 'fan-stopped' });
  });

  it('blocks airflow only in the exact divider zone', () => {
    const engine = new PuzzleEngine(stage003); drop(engine, 'file-divider', 'desk-props'); expect(engine.getState().stageThree?.airflowProtection).toBe('none');
    divider(engine); expect(engine.getState().stageThree?.airflowProtection).toBe('blocked');
  });

  it('extinguishes a lit candle as soon as the cake is picked up', () => {
    const engine = new PuzzleEngine(stage003); food(engine); unplug(engine); cake(engine); light(engine);
    engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'cake' }); expect(engine.getState().stageThree?.candleState).toBe('extinguished');
  });

  it('lights with a valid lighter drop and returns the lighter home', () => {
    const engine = new PuzzleEngine(stage003); cake(engine); expect(startLighting(engine).accepted).toBe(true);
    expect(engine.getState().stageThree?.candleState).toBe('lighting'); advance(engine, 300); expect(engine.getState().stageThree?.candleState).toBe('lit');
    expect(engine.getState().objects.lighter.position).toEqual(stage003Placements['lighter-home']);
  });

  it('prevents duplicate and already-lit ignition safely', () => {
    const engine = new PuzzleEngine(stage003); cake(engine); startLighting(engine);
    expect(startLighting(engine).accepted).toBe(false); advance(engine, 300); expect(startLighting(engine).accepted).toBe(false);
  });

  for (const [name, protectCat, protectAir] of [
    ['food + unplug', food, unplug], ['food + divider', food, divider], ['toy + unplug', toy, unplug], ['toy + divider', toy, divider],
  ] as const) {
    it(`completes with ${name}`, () => {
      const engine = new PuzzleEngine(stage003); protectCat(engine); protectAir(engine); cake(engine); light(engine); advance(engine, 3000);
      expect(engine.getState().progressState).toBe('completed');
    });
  }

  it('requires intact + desk + lit before stability can advance', () => {
    const engine = new PuzzleEngine(stage003); food(engine); unplug(engine); cake(engine); advance(engine, 2000); expect(engine.getState().goal.stableForMs).toBe(0);
    light(engine); advance(engine, 1); expect(engine.getState().goal.stableForMs).toBe(1);
  });

  it('completes at 3000ms, never at 2999ms, and emits completion once', () => {
    const engine = new PuzzleEngine(stage003); const listener = vi.fn<(event: GameEvent) => void>(); engine.subscribe(listener);
    food(engine); unplug(engine); cake(engine); light(engine); advance(engine, 2999); expect(engine.getState().progressState).not.toBe('completed'); advance(engine, 1); advance(engine, 5000);
    expect(engine.getState().progressState).toBe('completed'); expect(listener.mock.calls.flat().filter((event) => event.type === 'STAGE_COMPLETED')).toHaveLength(1);
  });

  it('reset restores a damaged cake, candle, fan, cat, and plug', () => {
    const engine = new PuzzleEngine(stage003); cake(engine); advance(engine, 1500); engine.reset();
    expect(engine.getState()).toMatchObject({ elapsedMs: 0, progressState: 'playing', stageThree: { cakeCondition: 'intact', cakeLocation: 'shelf', candleState: 'unlit', fanPower: 'powered', catThreat: 'active' } });
  });

  it('rejects unknown object and zone IDs without corruption', () => {
    const engine = new PuzzleEngine(stage003); expect(engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'missing' }).accepted).toBe(false);
    expect(engine.dispatch({ type: 'DROP_OBJECT', objectId: 'cake', zoneId: 'missing', worldPosition: { x: 0, y: 0 } }).accepted).toBe(false); expect(engine.getState().stageThree?.cakeCondition).toBe('intact');
  });

  it('has identical final state and major event order for large and small ticks', () => {
    const run = (step: number) => { const engine = new PuzzleEngine(stage003); const events: string[] = []; engine.subscribe((event) => { if (!['STATE_CHANGED', 'GOAL_STABILITY_UPDATED'].includes(event.type)) events.push(event.type); }); food(engine); cake(engine); light(engine); advance(engine, 5000, step); return { state: engine.getState(), events }; };
    const large = run(5000); const small = run(25); expect(large.state.stageThree).toEqual(small.state.stageThree); expect(large.state.goal).toEqual(small.state.goal); expect(large.events).toEqual(small.events);
  });

  it('rejects invalid virtual-time deltas', () => {
    const engine = new PuzzleEngine(stage003); expect(engine.dispatch({ type: 'ADVANCE_TIME', deltaMs: -1 }).accepted).toBe(false); expect(engine.getState().elapsedMs).toBe(0);
  });

  it('finishes ignition exactly on the 300ms boundary', () => {
    const engine = new PuzzleEngine(stage003); cake(engine); startLighting(engine); advance(engine, 299); expect(engine.getState().stageThree?.candleState).toBe('lighting'); advance(engine, 1); expect(engine.getState().stageThree?.candleState).toBe('lit');
  });

  it('keeps the fully lit flame visible before active airflow starts the 450ms flicker', () => {
    const engine = new PuzzleEngine(stage003); const events: string[] = [];
    engine.subscribe((event) => { if (event.type !== 'STATE_CHANGED') events.push(event.type); });
    food(engine); cake(engine); advance(engine, 700); startLighting(engine); advance(engine, 300);
    expect(engine.getState().stageThree).toMatchObject({ candleState: 'lit', candleTransitionRemainingMs: 100, airflowReachesCandle: true });
    expect(events.at(-1)).toBe('CANDLE_LIT');
    advance(engine, 99); expect(engine.getState().stageThree?.candleState).toBe('lit');
    advance(engine, 1); expect(engine.getState().stageThree).toMatchObject({ candleState: 'flickering', candleTransitionRemainingMs: 450 });
    expect(events.at(-1)).toBe('CANDLE_FLICKER_STARTED');
  });

  it('finishes airflow blowout exactly on the 450ms warning boundary', () => {
    const engine = new PuzzleEngine(stage003); food(engine); cake(engine); light(engine); advance(engine, 700); expect(engine.getState().stageThree?.candleState).toBe('flickering'); advance(engine, 449); expect(engine.getState().stageThree?.candleState).toBe('flickering'); advance(engine, 1); expect(engine.getState().stageThree?.candleState).toBe('extinguished');
  });

  it('cancels flicker if the divider arrives before blowout', () => {
    const engine = new PuzzleEngine(stage003); food(engine); cake(engine); light(engine); advance(engine, 750); expect(engine.getState().stageThree?.candleState).toBe('flickering'); divider(engine); expect(engine.getState().stageThree?.candleState).toBe('lit'); advance(engine, 1000); expect(engine.getState().stageThree?.candleState).toBe('lit');
  });

  it('does not automatically relight an already extinguished candle', () => {
    const engine = new PuzzleEngine(stage003); food(engine); cake(engine); light(engine); advance(engine, 1150); unplug(engine); expect(engine.getState().stageThree).toMatchObject({ fanPower: 'stopped', candleState: 'extinguished' });
  });

  it('emits a movement-specific blowout event when a lit cake is picked up', () => {
    const engine = new PuzzleEngine(stage003); const reasons: string[] = []; engine.subscribe((event) => { if (event.type === 'CANDLE_BLOWN_OUT') reasons.push(event.reason); }); food(engine); unplug(engine); cake(engine); light(engine); engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'cake' }); expect(reasons).toEqual(['movement']); expect(engine.getState().status).toBe('candle-moved');
  });

  it('orders cake placement before cat notice deterministically', () => {
    const engine = new PuzzleEngine(stage003); const events: string[] = []; engine.subscribe((event) => { if (event.type !== 'STATE_CHANGED') events.push(event.type); }); cake(engine); advance(engine, 250); expect(events.indexOf('CAKE_PLACED')).toBeLessThan(events.indexOf('CAT_NOTICED_CAKE'));
  });

  it('food cancels a pre-jump cake attack', () => {
    const engine = new PuzzleEngine(stage003); const events: string[] = []; engine.subscribe((event) => events.push(event.type)); cake(engine); advance(engine, 500); food(engine); expect(events).toContain('CAT_ATTACK_CANCELLED'); advance(engine, 2000); expect(engine.getState().stageThree?.cakeCondition).toBe('intact');
  });

  it('toy cancels a pre-jump cake attack', () => {
    const engine = new PuzzleEngine(stage003); const events: string[] = []; engine.subscribe((event) => events.push(event.type)); cake(engine); advance(engine, 500); toy(engine); expect(events).toContain('CAT_ATTACK_CANCELLED'); advance(engine, 2000); expect(engine.getState().stageThree?.cakeCondition).toBe('intact');
  });

  it('restores the plug socket anchor and all object locks on reset', () => {
    const engine = new PuzzleEngine(stage003); unplug(engine); food(engine); engine.reset(); expect(engine.getState().objects['power-plug']).toMatchObject({ zoneId: 'plug-socket', position: stage003Placements['plugged-anchor'], inputLocked: false }); expect(engine.getState().objects['cat-food'].inputLocked).toBe(false);
  });

  it('rejects candle lighting while the cake is outside the desk', () => {
    const engine = new PuzzleEngine(stage003); expect(startLighting(engine).accepted).toBe(false); expect(engine.getState().stageThree?.candleState).toBe('unlit');
  });

  it('rejects candle lighting for a damaged cake', () => {
    const engine = new PuzzleEngine(stage003); cake(engine); advance(engine, 1500); expect(startLighting(engine).accepted).toBe(false); expect(engine.getState().stageThree?.candleState).toBe('extinguished');
  });

  it('re-lights an extinguished candle', () => {
    const engine = new PuzzleEngine(stage003); food(engine); cake(engine); light(engine); advance(engine, 1150); expect(engine.getState().stageThree?.candleState).toBe('extinguished'); divider(engine); expect(startLighting(engine).accepted).toBe(true); advance(engine, 300); expect(engine.getState().stageThree?.candleState).toBe('lit');
  });

  it('emits one lighting start and one lit event across a large tick', () => {
    const engine = new PuzzleEngine(stage003); const events: string[] = []; engine.subscribe((event) => events.push(event.type)); cake(engine); startLighting(engine); advance(engine, 1000); expect(events.filter((event) => event === 'CANDLE_LIGHTING_STARTED')).toHaveLength(1); expect(events.filter((event) => event === 'CANDLE_LIT')).toHaveLength(1);
  });
});
