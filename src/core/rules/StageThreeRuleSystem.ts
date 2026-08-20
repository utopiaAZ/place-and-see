import type { GameEvent } from '../events/GameEvent';
import type { PuzzleStageDefinition, StageThreeDefinition, ZoneDefinition } from '../types/PuzzleStageDefinition';
import type { ObjectState, WorldState } from '../types/WorldTypes';
import type { FanDirection, ObjectId, Position, ZoneId } from '../types/identifiers';
import type { RuleResult } from './StageOneRuleSystem';

export const STAGE_THREE_RULE_ID = 'rule.stage-three-cake';
const EPSILON = 0.0001;

/** Independent composite rules for Stage 3. Time advances only through ADVANCE_TIME. */
export class StageThreeRuleSystem {
  private readonly config: StageThreeDefinition;

  public constructor(private readonly stage: PuzzleStageDefinition) {
    if (!stage.stageThree) throw new Error(`Stage ${stage.id} is missing Stage 3 configuration.`);
    this.config = stage.stageThree;
  }

  public pickUp(state: WorldState, objectId: ObjectId): RuleResult {
    const object = state.objects[objectId];
    const rejection = this.validateInteraction(state, object);
    if (rejection) return this.rejected(state, rejection);
    const events: GameEvent[] = [{ type: 'OBJECT_PICKED_UP', objectId }];
    let next = this.withObject(state, { ...object, isBeingDragged: true });
    if (objectId === this.config.cakeObjectId) {
      events.push({ type: 'CAKE_PICKED_UP' });
      next = this.withStageThree(next, { cakeLocation: 'held' });
      const candle = this.requiredState(next).candleState;
      if (candle === 'lit' || candle === 'flickering' || candle === 'lighting') {
        events.push({ type: 'CANDLE_BLOWN_OUT', reason: 'movement' });
        next = { ...this.withStageThree(next, { candleState: 'extinguished', candleTransitionRemainingMs: 0 }), status: 'candle-moved' };
      }
      next = this.cancelCakeAttackIfPossible(next, events);
    }
    if (objectId === this.config.blockerObjectId) next = this.recomputeAirflow(next, events);
    next = this.reconcileGoal(next, events);
    return this.accepted(this.refreshInputLocks(next), events);
  }

  public cancelDrag(state: WorldState, objectId: ObjectId): RuleResult {
    const object = state.objects[objectId];
    if (!object) return this.rejected(state, `Unknown object id: ${objectId}`);
    if (!object.isBeingDragged) return this.rejected(state, `Object is not being dragged: ${objectId}`);
    const events: GameEvent[] = [{ type: 'OBJECT_RETURNED', objectId }];
    let next = this.withObject(state, { ...object, isBeingDragged: false });
    if (objectId === this.config.cakeObjectId) next = this.withStageThree(next, { cakeLocation: this.cakeLocationForZone(object.zoneId) });
    next = this.recomputeAirflow(next, events);
    next = this.armCakeAttack(next);
    next = this.reconcileGoal(next, events);
    return this.accepted(this.refreshInputLocks(next), events);
  }

  public reportInvalidDrop(state: WorldState, objectId: ObjectId): RuleResult {
    return this.accepted(state, [{ type: 'OBJECT_DROP_REJECTED', objectId, reason: 'No valid drop zone.' }]);
  }

  public lightCandle(state: WorldState, lighterId: ObjectId): RuleResult {
    const lighter = state.objects[lighterId];
    const rejection = this.validateInteraction(state, lighter);
    if (rejection) return this.rejected(state, rejection);
    const detail = this.requiredState(state);
    if (lighterId !== this.config.lighterObjectId) return this.rejected(state, `Object cannot light the candle: ${lighterId}`);
    if (detail.cakeLocation !== 'desk') return this.rejected(state, 'The cake must be on the desk before lighting.');
    if (detail.cakeCondition !== 'intact') return this.rejected(state, 'A damaged cake cannot be lit.');
    if (!['unlit', 'extinguished'].includes(detail.candleState)) return this.rejected(state, `The candle cannot be lit from ${detail.candleState}.`);
    if (this.config.candleIgnitionMs <= 0) return this.rejected(state, 'Candle ignition duration must be positive.');

    let next = this.withObject(state, {
      ...lighter,
      position: { ...this.config.lighterHomePosition },
      zoneId: 'shelf',
      isBeingDragged: false,
    });
    next = this.withStageThree(next, { candleState: 'lighting', candleTransitionRemainingMs: this.config.candleIgnitionMs });
    return this.accepted(this.refreshInputLocks(next), [{ type: 'CANDLE_LIGHTING_STARTED' }]);
  }

  public drop(state: WorldState, objectId: ObjectId, zoneId: ZoneId, worldPosition: Position): RuleResult {
    const object = state.objects[objectId];
    const rejection = this.validateInteraction(state, object);
    if (rejection) return this.rejectedDrop(state, objectId, rejection);
    const zone = this.stage.zones.find((candidate) => candidate.id === zoneId);
    if (!zone) return this.rejectedDrop(state, objectId, `Unknown zone id: ${zoneId}`);
    if (!zone.accepts.includes(object.kind)) return this.rejectedDrop(state, objectId, `${object.kind} cannot be dropped in ${zoneId}`);
    if (!this.contains(zone, worldPosition)) return this.rejectedDrop(state, objectId, `Position is outside zone: ${zoneId}`);
    if (objectId === this.config.lighterObjectId && zoneId === this.config.ignitionZoneId) {
      return this.rejectedDrop(state, objectId, 'Use the candle lighting interaction for this target.');
    }

    const position = zone.snapPositions?.[object.kind] ?? worldPosition;
    const events: GameEvent[] = [{ type: 'OBJECT_DROPPED', objectId, zoneId, position }];
    let next = this.withObject(state, { ...object, position: { ...position }, zoneId, isBeingDragged: false });
    if (objectId === this.config.cakeObjectId) {
      const onDesk = zoneId === this.config.cakeDeskZoneId;
      next = this.withStageThree(next, { cakeLocation: this.cakeLocationForZone(zoneId) });
      if (onDesk) events.push({ type: 'CAKE_PLACED' });
      next = onDesk ? this.armCakeAttack(next) : this.cancelCakeAttackIfPossible(next, events);
    } else if (objectId === this.config.foodObjectId && zoneId === this.config.foodZoneId) {
      next = this.startDistraction(next, 'food', position, events);
    } else if (objectId === this.config.toyObjectId && zoneId === this.config.toyZoneId) {
      next = this.startDistraction(next, 'toy', position, events);
    } else if (objectId === this.config.plugObjectId && zoneId === this.config.unpluggedZoneId && this.requiredState(next).plugConnected) {
      next = this.withStageThree(next, { plugConnected: false, fanPower: 'slowing-down', fanSlowdownRemainingMs: this.config.fanSlowdownMs });
      events.push({ type: 'PLUG_UNPLUGGED' }, { type: 'FAN_SLOWING_DOWN' });
    }
    next = this.recomputeAirflow(next, events);
    next = this.reconcileGoal(next, events);
    return this.accepted(this.refreshInputLocks(next), events);
  }

  public advance(state: WorldState, deltaMs: number): RuleResult {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) return this.rejected(state, 'deltaMs must be a finite, non-negative number.');
    if (deltaMs === 0 || state.progressState === 'completed') return this.accepted(state, []);
    const events: GameEvent[] = [];
    let next = state;
    let remaining = deltaMs;
    let guard = 0;
    while (remaining > EPSILON && next.progressState !== 'completed') {
      if (++guard > 300) throw new Error('StageThreeRuleSystem transition guard exceeded.');
      const segment = Math.min(
        remaining,
        this.timeToFanBoundary(next), this.timeToSlowdownBoundary(next), this.timeToCandleBoundary(next),
        this.timeToToyBoundary(next), this.timeToCatBoundary(next), this.timeToGoalBoundary(next),
      );
      if (segment > EPSILON) { next = this.advanceSegment(next, segment); remaining -= segment; }
      const before = next;
      next = this.processSlowdownBoundary(next, events);
      next = this.processFanBoundary(next, events);
      next = this.processCandleBoundary(next, events);
      next = this.processToyBoundary(next, events);
      next = this.processCatBoundary(next, events);
      next = this.recomputeAirflow(next, events);
      next = this.reconcileGoal(next, events);
      if (segment <= EPSILON && next === before) { const fallback = Math.min(remaining, 1); next = this.advanceSegment(next, fallback); remaining -= fallback; }
    }
    return this.accepted(this.refreshInputLocks(next), events);
  }

  private advanceSegment(state: WorldState, deltaMs: number): WorldState {
    const detail = this.requiredState(state);
    const cat = state.actors.cat;
    const matches = this.isGoalSatisfied(state);
    const stableForMs = matches ? Math.min(state.goal.requiredMs, state.goal.stableForMs + deltaMs) : 0;
    return {
      ...state,
      elapsedMs: state.elapsedMs + deltaMs,
      actors: { ...state.actors, cat: { ...cat, behaviorElapsedMs: cat.behaviorElapsedMs + deltaMs } },
      stageThree: {
        ...detail,
        fanPhaseElapsedMs: detail.fanPower === 'powered' ? detail.fanPhaseElapsedMs + deltaMs : detail.fanPhaseElapsedMs,
        fanSlowdownRemainingMs: detail.fanPower === 'slowing-down' ? Math.max(0, detail.fanSlowdownRemainingMs - deltaMs) : detail.fanSlowdownRemainingMs,
        candleTransitionRemainingMs: detail.candleTransitionRemainingMs > 0 ? Math.max(0, detail.candleTransitionRemainingMs - deltaMs) : 0,
        toyRemainingMs: detail.catThreat === 'temporarily-distracted' ? Math.max(0, detail.toyRemainingMs - deltaMs) : detail.toyRemainingMs,
      },
      goal: { ...state.goal, active: matches, stableForMs, progress: stableForMs / state.goal.requiredMs },
    };
  }

  private processSlowdownBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.fanPower !== 'slowing-down' || detail.fanSlowdownRemainingMs > EPSILON) return state;
    events.push({ type: 'FAN_STOPPED' });
    return this.withStageThree(state, { fanPower: 'stopped', bladesSpinning: false, fanSlowdownRemainingMs: 0 });
  }

  private processFanBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.fanPower !== 'powered' || detail.fanPhaseElapsedMs + EPSILON < this.config.fanPhaseDurationMs) return state;
    const fanDirection = this.nextDirection(detail.fanDirection);
    let next = this.withStageThree(state, { fanDirection, fanPhaseElapsedMs: Math.max(0, detail.fanPhaseElapsedMs - this.config.fanPhaseDurationMs) });
    if (fanDirection === 'turning-toward-desk') events.push({ type: 'FAN_TURNED_TOWARD_DESK' });
    next = this.recomputeAirflow(next, events);
    return next;
  }

  private processCandleBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.candleTransitionRemainingMs > EPSILON) return state;
    if (detail.candleState === 'lighting') {
      events.push({ type: 'CANDLE_LIT' });
      return this.withStageThree(state, { candleState: 'lit', candleTransitionRemainingMs: this.config.candleLitHoldMs });
    }
    if (detail.candleState === 'flickering') {
      events.push({ type: 'CANDLE_BLOWN_OUT', reason: 'airflow' });
      return { ...this.withStageThree(state, { candleState: 'extinguished', candleTransitionRemainingMs: 0 }), status: 'candle-blown-out' };
    }
    return state;
  }

  private processToyBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.catThreat !== 'temporarily-distracted' || detail.toyRemainingMs > EPSILON) return state;
    events.push({ type: 'CAT_DISTRACTION_ENDED' }, { type: 'CAT_RETURNING' });
    const cat = state.actors.cat;
    let next = this.withCat(state, { ...cat, behavior: 'returning', behaviorElapsedMs: 0, position: { ...cat.homePosition }, attentionTargetId: null });
    next = this.withStageThree(next, { catThreat: 'active', toyRemainingMs: 0 });
    return this.armCakeAttack(next);
  }

  private processCatBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const cat = state.actors.cat;
    if (this.timeToCatBoundary(state) > EPSILON) return state;
    const cake = state.objects[this.config.cakeObjectId];
    switch (cat.behavior) {
      case 'idle':
      case 'returning':
        if (!this.canAttackCake(state)) return this.withCat(state, { ...cat, behavior: 'idle', behaviorElapsedMs: 0, position: { ...cat.homePosition }, attentionTargetId: null });
        events.push({ type: 'CAT_NOTICED_CAKE' });
        return { ...this.withCat(state, { ...cat, behavior: 'noticing-bottle', behaviorElapsedMs: 0, attentionTargetId: this.config.cakeObjectId }), status: 'cat-noticed' };
      case 'noticing-bottle':
        events.push({ type: 'CAT_PREPARING_JUMP' });
        return { ...this.withCat(state, { ...cat, behavior: 'preparing-jump', behaviorElapsedMs: 0 }), status: 'cat-preparing' };
      case 'preparing-jump':
        events.push({ type: 'CAT_JUMPED' });
        return { ...this.withCat(state, { ...cat, behavior: 'jumping', behaviorElapsedMs: 0, position: { x: cake.position.x - 120, y: cake.position.y + 145 } }), status: 'cat-jumping' };
      case 'jumping':
        events.push({ type: 'CAT_LANDED' }, { type: 'CAT_HIT_CAKE' }, { type: 'CAKE_DAMAGED' });
        return {
          ...this.withObject(this.withCat(state, { ...cat, behavior: 'tapping-bottle', behaviorElapsedMs: 0 }), { ...cake, position: { ...this.config.damagedCakePosition }, zoneId: 'floor' }),
          stageThree: { ...this.requiredState(state), cakeCondition: 'damaged', cakeLocation: 'floor', candleState: 'extinguished', candleTransitionRemainingMs: 0 },
          status: 'cake-damaged',
        };
      case 'tapping-bottle':
        return this.withCat(state, { ...cat, behavior: 'returning', behaviorElapsedMs: 0, position: { ...cat.homePosition }, attentionTargetId: null });
      default: return state;
    }
  }

  private recomputeAirflow(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    const blocker = state.objects[this.config.blockerObjectId];
    const blocked = blocker.zoneId === this.config.blockerZoneId && !blocker.isBeingDragged;
    const protection = detail.fanPower === 'stopped' ? 'fan-stopped' : blocked ? 'blocked' : 'none';
    if (blocked && !detail.airflowBlocked) events.push({ type: 'AIRFLOW_BLOCKED' });
    if (!blocked && detail.airflowBlocked) events.push({ type: 'AIRFLOW_UNBLOCKED' });
    const reaches = detail.cakeLocation === 'desk' && this.fanAimsAtDesk(state) && detail.fanPower !== 'stopped' && !blocked;
    let next = this.withStageThree(state, { airflowBlocked: blocked, airflowProtection: protection, airflowReachesCandle: reaches });
    const candle = this.requiredState(next).candleState;
    if (reaches && candle === 'lit' && this.requiredState(next).candleTransitionRemainingMs <= EPSILON) {
      events.push({ type: 'CANDLE_FLICKER_STARTED' });
      next = { ...this.withStageThree(next, { candleState: 'flickering', candleTransitionRemainingMs: this.config.candleBlowoutMs }), status: 'candle-flickering' };
    } else if ((!reaches || protection !== 'none') && candle === 'flickering') {
      events.push({ type: 'CANDLE_FLICKER_STOPPED' });
      next = this.withStageThree(next, { candleState: 'lit', candleTransitionRemainingMs: 0 });
    }
    return next;
  }

  private startDistraction(state: WorldState, kind: 'food' | 'toy', position: Position, events: GameEvent[]): WorldState {
    const cat = state.actors.cat;
    if (cat.behavior === 'jumping' || cat.behavior === 'tapping-bottle') return state;
    if (cat.attentionTargetId === this.config.cakeObjectId) events.push({ type: 'CAT_ATTACK_CANCELLED' });
    events.push(kind === 'food' ? { type: 'CAT_DISTRACTED_BY_FOOD', position } : { type: 'CAT_DISTRACTED_BY_TOY', position });
    const next = this.withCat(state, {
      ...cat, behavior: kind === 'food' ? 'distracted-by-food' : 'playing-with-toy', behaviorElapsedMs: 0,
      position: { ...position }, attentionTargetId: kind === 'food' ? this.config.foodObjectId : this.config.toyObjectId,
    });
    return {
      ...this.withStageThree(next, { catThreat: kind === 'food' ? 'permanently-distracted' : 'temporarily-distracted', toyRemainingMs: kind === 'toy' ? this.stage.timings.toyDistractionMs : 0 }),
      status: kind === 'food' ? 'cat-food' : 'cat-toy',
    };
  }

  private reconcileGoal(state: WorldState, events: GameEvent[]): WorldState {
    if (state.progressState === 'completed') return state;
    const matches = this.isGoalSatisfied(state);
    if (!matches) {
      if (state.goal.active || state.goal.stableForMs > 0) events.push({ type: 'GOAL_STABILITY_RESET' });
      return { ...state, goal: { ...state.goal, active: false, stableForMs: 0, progress: 0 }, progressState: 'playing' };
    }
    let next = state;
    if (!state.goal.active) {
      events.push({ type: 'GOAL_STABILITY_STARTED' });
      next = { ...next, goal: { ...state.goal, active: true }, progressState: 'stabilizing', status: 'stabilizing' };
    }
    events.push({ type: 'GOAL_STABILITY_UPDATED', progress: next.goal.stableForMs / next.goal.requiredMs });
    if (next.goal.stableForMs + EPSILON >= next.goal.requiredMs && this.isGoalSatisfied(next)) {
      events.push({ type: 'STAGE_COMPLETED' });
      next = { ...next, goal: { ...next.goal, active: true, stableForMs: next.goal.requiredMs, progress: 1, completed: true }, progressState: 'completed', status: 'completed' };
    }
    return next;
  }

  private isGoalSatisfied(state: WorldState): boolean {
    const detail = this.requiredState(state);
    const cake = state.objects[this.config.cakeObjectId];
    return detail.cakeLocation === 'desk' && !cake.isBeingDragged && detail.cakeCondition === 'intact' && detail.candleState === 'lit' && detail.catThreat !== 'active' && detail.airflowProtection !== 'none';
  }

  private armCakeAttack(state: WorldState): WorldState {
    if (!this.canAttackCake(state)) return state;
    const cat = state.actors.cat;
    if (cat.behavior === 'idle' || cat.behavior === 'returning') return this.withCat(state, { ...cat, attentionTargetId: this.config.cakeObjectId, behaviorElapsedMs: 0 });
    return state;
  }

  private cancelCakeAttackIfPossible(state: WorldState, events: GameEvent[]): WorldState {
    const cat = state.actors.cat;
    if (cat.attentionTargetId !== this.config.cakeObjectId || !['idle', 'noticing-bottle', 'preparing-jump'].includes(cat.behavior)) return state;
    events.push({ type: 'CAT_ATTACK_CANCELLED' });
    return this.withCat(state, { ...cat, behavior: 'idle', behaviorElapsedMs: 0, attentionTargetId: null, position: { ...cat.homePosition } });
  }

  private canAttackCake(state: WorldState): boolean {
    const detail = this.requiredState(state);
    return detail.cakeLocation === 'desk' && detail.cakeCondition === 'intact' && detail.catThreat === 'active' && !state.objects[this.config.cakeObjectId].isBeingDragged;
  }

  private timeToFanBoundary(state: WorldState): number { const d = this.requiredState(state); return d.fanPower === 'powered' ? Math.max(0, this.config.fanPhaseDurationMs - d.fanPhaseElapsedMs) : Infinity; }
  private timeToSlowdownBoundary(state: WorldState): number { const d = this.requiredState(state); return d.fanPower === 'slowing-down' ? d.fanSlowdownRemainingMs : Infinity; }
  private timeToCandleBoundary(state: WorldState): number { const d = this.requiredState(state); return ['lighting', 'flickering'].includes(d.candleState) ? d.candleTransitionRemainingMs : Infinity; }
  private timeToToyBoundary(state: WorldState): number { const d = this.requiredState(state); return d.catThreat === 'temporarily-distracted' ? d.toyRemainingMs : Infinity; }
  private timeToGoalBoundary(state: WorldState): number { return this.isGoalSatisfied(state) ? Math.max(0, state.goal.requiredMs - state.goal.stableForMs) : Infinity; }
  private timeToCatBoundary(state: WorldState): number {
    const cat = state.actors.cat;
    if (cat.behavior === 'idle' && cat.attentionTargetId !== this.config.cakeObjectId) return Infinity;
    const duration = cat.behavior === 'idle' ? this.stage.timings.catDetectMs
      : cat.behavior === 'noticing-bottle' ? this.stage.timings.catNoticeMs
        : cat.behavior === 'preparing-jump' ? this.stage.timings.catPrepareMs
          : cat.behavior === 'jumping' ? this.stage.timings.catJumpMs
            : cat.behavior === 'tapping-bottle' ? this.stage.timings.catTapMs
              : cat.behavior === 'returning' ? this.stage.timings.catReturnMs : Infinity;
    return Number.isFinite(duration) ? Math.max(0, duration - cat.behaviorElapsedMs) : Infinity;
  }

  private nextDirection(direction: FanDirection): FanDirection { return direction === 'away' ? 'turning-toward-desk' : direction === 'turning-toward-desk' ? 'toward-desk' : direction === 'toward-desk' ? 'turning-away' : 'away'; }
  private fanAimsAtDesk(state: WorldState): boolean { return ['turning-toward-desk', 'toward-desk'].includes(this.requiredState(state).fanDirection); }
  private cakeLocationForZone(zoneId: ZoneId) { return zoneId === this.config.cakeDeskZoneId ? 'desk' as const : zoneId === 'floor' ? 'floor' as const : 'shelf' as const; }
  private contains(zone: ZoneDefinition, p: Position): boolean { return p.x >= zone.bounds.x && p.x <= zone.bounds.x + zone.bounds.width && p.y >= zone.bounds.y && p.y <= zone.bounds.y + zone.bounds.height; }
  private requiredState(state: WorldState) { if (!state.stageThree) throw new Error('Stage 3 state is unavailable.'); return state.stageThree; }
  private withStageThree(state: WorldState, update: Partial<NonNullable<WorldState['stageThree']>>): WorldState { return { ...state, stageThree: { ...this.requiredState(state), ...update } }; }
  private withObject(state: WorldState, object: ObjectState): WorldState { return { ...state, objects: { ...state.objects, [object.id]: object } }; }
  private withCat(state: WorldState, cat: WorldState['actors'][string]): WorldState { return { ...state, actors: { ...state.actors, cat } }; }
  private validateInteraction(state: WorldState, object: ObjectState | undefined): string | undefined { if (state.progressState === 'completed') return 'Stage is completed.'; if (!object) return 'Unknown object id.'; if (!object.draggable) return `Object is not draggable: ${object.id}`; if (object.inputLocked) return `Object input is locked: ${object.id}`; return undefined; }
  private refreshInputLocks(state: WorldState): WorldState {
    const detail = this.requiredState(state); const completed = state.progressState === 'completed';
    const objects = Object.fromEntries(Object.entries(state.objects).map(([id, object]) => [id, { ...object, inputLocked: completed || (id === this.config.plugObjectId && !detail.plugConnected) || (id === this.config.foodObjectId && detail.catThreat === 'permanently-distracted') || (id === this.config.toyObjectId && detail.catThreat === 'temporarily-distracted') }]));
    return { ...state, objects };
  }
  private accepted(state: WorldState, events: readonly GameEvent[]): RuleResult { return { state, events, accepted: true }; }
  private rejected(state: WorldState, reason: string): RuleResult { return { state, events: [{ type: 'COMMAND_REJECTED', reason }], accepted: false, reason }; }
  private rejectedDrop(state: WorldState, objectId: ObjectId, reason: string): RuleResult { return { state, events: [{ type: 'OBJECT_DROP_REJECTED', objectId, reason }, { type: 'COMMAND_REJECTED', reason }], accepted: false, reason }; }
}
