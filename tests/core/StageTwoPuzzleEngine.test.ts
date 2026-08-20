import { describe, expect, it, vi } from 'vitest';
import { stage002, stage002Placements } from '../../src/content/stages/stage-002';
import { PuzzleEngine } from '../../src/core/engine/PuzzleEngine';
import type { GameEvent } from '../../src/core/events/GameEvent';
import type { ZoneId } from '../../src/core/types/identifiers';

const positionFor: Record<ZoneId, { x: number; y: number }> = {
  floor: { x: 600, y: 720 },
  shelf: { x: 200, y: 430 },
  'desk-surface': { x: 1200, y: 400 },
  'document-desk': stage002Placements['document-desk'],
  'paper-weight': stage002Placements['paper-weight'],
  'airflow-blocker': stage002Placements['airflow-blocker'],
  'desk-props': stage002Placements['desk-prop'],
  'plug-socket': stage002Placements['plugged-anchor'],
  'plug-unplugged': stage002Placements['unplugged-anchor'],
};

const drop = (engine: PuzzleEngine, objectId: string, zoneId: ZoneId) => engine.dispatch({
  type: 'DROP_OBJECT', objectId, zoneId, worldPosition: positionFor[zoneId],
});
const advance = (engine: PuzzleEngine, totalMs: number, stepMs = totalMs) => {
  for (let remaining = totalMs; remaining > 0;) {
    const deltaMs = Math.min(stepMs, remaining);
    engine.dispatch({ type: 'ADVANCE_TIME', deltaMs });
    remaining -= deltaMs;
  }
};

describe('Stage 2 PuzzleEngine', () => {
  it('starts with a powered fan, connected plug, and unprotected document', () => {
    const state = new PuzzleEngine(stage002).getState();
    expect(state.stageTwo).toMatchObject({ fanPower: 'powered', plugConnected: true, fanDirection: 'away', paperState: 'at-initial-position', paperProtection: 'none' });
    expect(state.progressState).toBe('playing');
  });

  it('places an unprotected document, then flutters and blows it away before success', () => {
    const engine = new PuzzleEngine(stage002);
    const listener = vi.fn<(event: GameEvent) => void>();
    engine.subscribe(listener);
    expect(drop(engine, 'document', 'document-desk').accepted).toBe(true);
    expect(engine.getState().goal.active).toBe(true);
    advance(engine, 1700);
    expect(engine.getState().stageTwo?.paperState).toBe('blown-away');
    expect(engine.getState().goal.progress).toBe(0);
    expect(engine.getState().progressState).not.toBe('completed');
    expect(listener.mock.calls.flat().filter((event) => event.type === 'PAPER_BLOWN_AWAY')).toHaveLength(1);
  });

  it('allows a blown-away document to be picked up and retried', () => {
    const engine = new PuzzleEngine(stage002);
    drop(engine, 'document', 'document-desk'); advance(engine, 1700);
    expect(engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'document' }).accepted).toBe(true);
    expect(drop(engine, 'document', 'document-desk').accepted).toBe(true);
    expect(['on-desk', 'fluttering']).toContain(engine.getState().stageTwo?.paperState);
  });

  it('unplugs, slows down deterministically, then succeeds with a stopped fan', () => {
    const engine = new PuzzleEngine(stage002);
    expect(drop(engine, 'power-plug', 'plug-unplugged').accepted).toBe(true);
    expect(engine.getState().stageTwo?.fanPower).toBe('slowing-down');
    advance(engine, 599);
    expect(engine.getState().stageTwo?.fanPower).toBe('slowing-down');
    advance(engine, 1);
    expect(engine.getState().stageTwo?.fanPower).toBe('stopped');
    drop(engine, 'document', 'document-desk'); advance(engine, 2999);
    expect(engine.getState().progressState).not.toBe('completed');
    advance(engine, 1);
    expect(engine.getState().stageTwo?.paperProtection).toBe('fan-stopped');
    expect(engine.getState().progressState).toBe('completed');
  });

  it('uses the bottle only when it is in the paper weight zone', () => {
    const engine = new PuzzleEngine(stage002);
    expect(drop(engine, 'bottle', 'paper-weight').accepted).toBe(false);
    drop(engine, 'document', 'document-desk');
    drop(engine, 'bottle', 'desk-props');
    expect(engine.getState().stageTwo?.paperProtection).toBe('none');
    drop(engine, 'bottle', 'paper-weight');
    expect(engine.getState().stageTwo?.paperProtection).toBe('weighted-by-bottle');
    advance(engine, 3000);
    expect(engine.getState().progressState).toBe('completed');
  });

  it('removes bottle protection immediately on pickup', () => {
    const engine = new PuzzleEngine(stage002);
    drop(engine, 'document', 'document-desk'); drop(engine, 'bottle', 'paper-weight');
    engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'bottle' });
    expect(engine.getState().stageTwo?.paperProtection).toBe('none');
  });

  it('blocks airflow only in the explicit blocker zone and can remove it', () => {
    const engine = new PuzzleEngine(stage002);
    drop(engine, 'file-divider', 'desk-props');
    expect(engine.getState().stageTwo?.airflowBlocked).toBe(false);
    drop(engine, 'file-divider', 'airflow-blocker');
    expect(engine.getState().stageTwo?.paperProtection).toBe('airflow-blocked');
    engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'file-divider' });
    expect(engine.getState().stageTwo?.airflowBlocked).toBe(false);
  });

  it('completes independently with the airflow blocker', () => {
    const engine = new PuzzleEngine(stage002);
    drop(engine, 'file-divider', 'airflow-blocker'); drop(engine, 'document', 'document-desk'); advance(engine, 3000);
    expect(engine.getState().progressState).toBe('completed');
  });

  it('cannot win by timing an unprotected placement while the fan points away', () => {
    const engine = new PuzzleEngine(stage002);
    drop(engine, 'document', 'document-desk'); advance(engine, 4000);
    expect(engine.getState().progressState).not.toBe('completed');
  });

  it('stops flutter when fan slowdown finishes before blow-away', () => {
    const engine = new PuzzleEngine(stage002);
    drop(engine, 'document', 'document-desk'); advance(engine, 1100);
    expect(engine.getState().stageTwo?.paperState).toBe('fluttering');
    drop(engine, 'power-plug', 'plug-unplugged'); advance(engine, 600);
    expect(engine.getState().stageTwo).toMatchObject({ fanPower: 'stopped', paperState: 'on-desk', paperProtection: 'fan-stopped' });
  });

  it('resets every Stage 2 state and emits completion only once', () => {
    const engine = new PuzzleEngine(stage002);
    const listener = vi.fn<(event: GameEvent) => void>(); engine.subscribe(listener);
    drop(engine, 'power-plug', 'plug-unplugged'); advance(engine, 600); drop(engine, 'document', 'document-desk'); advance(engine, 4000); advance(engine, 4000);
    expect(listener.mock.calls.flat().filter((event) => event.type === 'STAGE_COMPLETED')).toHaveLength(1);
    engine.dispatch({ type: 'RESET_STAGE' });
    expect(engine.getState()).toMatchObject({ elapsedMs: 0, progressState: 'playing', stageTwo: { fanPower: 'powered', plugConnected: true, paperProtection: 'none' } });
  });

  it('rejects unknown object and zone IDs without corrupting state', () => {
    const engine = new PuzzleEngine(stage002);
    expect(engine.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'missing' }).accepted).toBe(false);
    expect(engine.dispatch({ type: 'DROP_OBJECT', objectId: 'document', zoneId: 'missing' as ZoneId, worldPosition: { x: 0, y: 0 } }).accepted).toBe(false);
    expect(engine.getState().stageTwo?.fanPower).toBe('powered');
  });

  it('has identical important state and event order for large and small ticks', () => {
    const run = (step: number) => {
      const engine = new PuzzleEngine(stage002); const events: string[] = [];
      engine.subscribe((event) => { if (!['STATE_CHANGED', 'GOAL_STABILITY_UPDATED'].includes(event.type)) events.push(event.type); });
      drop(engine, 'document', 'document-desk'); advance(engine, 5000, step);
      return { state: engine.getState(), events };
    };
    const large = run(5000); const small = run(50);
    expect(large.state.stageTwo).toEqual(small.state.stageTwo);
    expect(large.state.progressState).toBe(small.state.progressState);
    expect(large.events).toEqual(small.events);
  });

  it('emits unplug once and restores the plug socket anchor on reset', () => {
    const engine = new PuzzleEngine(stage002);
    const events: string[] = [];
    engine.subscribe((event) => events.push(event.type));
    expect(drop(engine, 'power-plug', 'plug-unplugged').accepted).toBe(true);
    expect(drop(engine, 'power-plug', 'plug-unplugged').accepted).toBe(false);
    expect(events.filter((type) => type === 'PLUG_UNPLUGGED')).toHaveLength(1);
    engine.reset();
    expect(engine.getState().objects['power-plug']).toMatchObject({
      zoneId: 'plug-socket',
      position: stage002Placements['plugged-anchor'],
      inputLocked: false,
    });
  });
});
