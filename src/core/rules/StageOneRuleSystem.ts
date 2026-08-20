import type { GameEvent } from '../events/GameEvent';
import type { PuzzleStageDefinition, ZoneDefinition } from '../types/PuzzleStageDefinition';
import type { ActorState, ObjectState, WorldState } from '../types/WorldTypes';
import type { ObjectId, Position, ZoneId } from '../types/identifiers';

export const STAGE_ONE_RULE_ID = 'rule.stage-one-causal-puzzle';
const EPSILON = 0.0001;

export interface RuleResult {
  readonly state: WorldState;
  readonly events: readonly GameEvent[];
  readonly accepted: boolean;
  readonly reason?: string;
}

export class StageOneRuleSystem {
  public constructor(private readonly stage: PuzzleStageDefinition) {}

  public pickUp(state: WorldState, objectId: ObjectId): RuleResult {
    const object = state.objects[objectId];
    const rejection = this.validateInteraction(state, object);
    if (rejection) return this.rejected(state, rejection);
    const events: GameEvent[] = [{ type: 'OBJECT_PICKED_UP', objectId }];
    let next = this.withObject(state, {
      ...object,
      isBeingDragged: true,
      orientation: object.kind === 'bottle' ? 'upright' : object.orientation,
      effectRemainingMs: 0,
    });
    if (object.kind === 'bottle') next = this.cancelBottleAttackIfPossible(next, events);
    next = this.recomputeSupport(next);
    next = this.reconcileGoal(next, events);
    return this.accepted(this.refreshInputLocks(next), events);
  }

  public cancelDrag(state: WorldState, objectId: ObjectId): RuleResult {
    const object = state.objects[objectId];
    if (!object) return this.rejected(state, `Unknown object id: ${objectId}`);
    if (!object.isBeingDragged) return this.rejected(state, `Object is not being dragged: ${objectId}`);
    const events: GameEvent[] = [{ type: 'OBJECT_RETURNED', objectId }];
    let next = this.withObject(state, { ...object, isBeingDragged: false });
    next = this.recomputeSupport(next);
    next = this.armBottleReaction(next);
    next = this.reconcileGoal(next, events);
    return this.accepted(this.refreshInputLocks(next), events);
  }

  public reportInvalidDrop(state: WorldState, objectId: ObjectId): RuleResult {
    return this.accepted(state, [{ type: 'OBJECT_DROP_REJECTED', objectId, reason: 'No valid drop zone.' }]);
  }

  public drop(state: WorldState, objectId: ObjectId, zoneId: ZoneId, worldPosition: Position): RuleResult {
    const object = state.objects[objectId];
    const rejection = this.validateInteraction(state, object);
    if (rejection) return this.rejectedDrop(state, objectId, rejection);
    const zone = this.stage.zones.find((candidate) => candidate.id === zoneId);
    if (!zone) return this.rejectedDrop(state, objectId, `Unknown zone id: ${zoneId}`);
    if (!zone.accepts.includes(object.kind)) return this.rejectedDrop(state, objectId, `${object.kind} cannot be dropped in ${zoneId}`);
    if (!this.contains(zone, worldPosition)) return this.rejectedDrop(state, objectId, `Position is outside zone: ${zoneId}`);

    const position = zone.snapPositions?.[object.kind] ?? worldPosition;
    const events: GameEvent[] = [{ type: 'OBJECT_DROPPED', objectId, zoneId, position }];
    let next = this.withObject(state, {
      ...object,
      position: { ...position },
      zoneId,
      orientation: object.kind === 'bottle' ? 'upright' : object.orientation,
      effectRemainingMs: 0,
      isBeingDragged: false,
    });
    next = this.recomputeSupport(next);

    if (object.kind === 'bottle') {
      if (zoneId === this.stage.goal.zoneId) {
        events.push({ type: 'BOTTLE_PLACED_ON_DESK' });
        next = this.armBottleReaction(next);
      } else {
        next = this.cancelBottleAttackIfPossible(next, events);
      }
    } else if (object.kind === 'cat-food' && zoneId === 'floor') {
      next = this.handleDistraction(next, 'cat-food', position, events);
    } else if (object.kind === 'toy-mouse' && zoneId === 'floor') {
      next = this.handleDistraction(next, 'toy-mouse', position, events);
    } else if (object.kind === 'non-slip-mat' && zoneId === 'desk-surface' && next.objects.bottle?.isSupportedByMat) {
      events.push({ type: 'BOTTLE_STABILIZED_BY_MAT' });
      next = { ...next, status: 'mat-support' };
    }

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
      if (++guard > 100) throw new Error('StageOneRuleSystem transition guard exceeded.');
      const catBoundary = this.timeToCatBoundary(next);
      const bottleBoundary = next.objects.bottle.effectRemainingMs > 0 ? next.objects.bottle.effectRemainingMs : Number.POSITIVE_INFINITY;
      const goalBoundary = this.isGoalSatisfied(next) ? Math.max(0, next.goal.requiredMs - next.goal.stableForMs) : Number.POSITIVE_INFINITY;
      const segment = Math.min(remaining, catBoundary, bottleBoundary, goalBoundary);

      if (segment > EPSILON) {
        next = this.advanceSegment(next, segment);
        remaining -= segment;
      }
      const beforeTransition = next;
      next = this.processBottleBoundary(next, events);
      next = this.processCatBoundary(next, events);
      next = this.recomputeSupport(next);
      next = this.reconcileGoal(next, events);
      if (segment <= EPSILON && next === beforeTransition) {
        const fallback = Math.min(remaining, 1);
        next = this.advanceSegment(next, fallback);
        remaining -= fallback;
      }
    }
    return this.accepted(this.refreshInputLocks(next), events);
  }

  private advanceSegment(state: WorldState, deltaMs: number): WorldState {
    const cat = state.actors.cat;
    const bottle = state.objects.bottle;
    const goalMatches = this.isGoalSatisfied(state);
    const stableForMs = goalMatches ? Math.min(state.goal.requiredMs, state.goal.stableForMs + deltaMs) : 0;
    return {
      ...state,
      elapsedMs: state.elapsedMs + deltaMs,
      actors: { ...state.actors, cat: { ...cat, behaviorElapsedMs: cat.behaviorElapsedMs + deltaMs } },
      objects: { ...state.objects, bottle: { ...bottle, effectRemainingMs: Math.max(0, bottle.effectRemainingMs - deltaMs) } },
      goal: { ...state.goal, active: goalMatches, stableForMs, progress: stableForMs / state.goal.requiredMs },
    };
  }

  private processBottleBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const bottle = state.objects.bottle;
    if (bottle.orientation !== 'wobbling' || bottle.effectRemainingMs > EPSILON) return state;
    events.push({ type: 'BOTTLE_FELL', position: bottle.position });
    events.push({ type: 'WATER_SPILLED', position: bottle.position });
    return {
      ...this.withObject(state, { ...bottle, orientation: 'fallen', effectRemainingMs: 0 }),
      spillVisible: true,
      spillPosition: { ...bottle.position },
      status: 'bottle-fell',
    };
  }

  private processCatBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const cat = state.actors.cat;
    if (this.timeToCatBoundary(state) > EPSILON) return state;
    const bottle = state.objects.bottle;
    switch (cat.behavior) {
      case 'idle':
        if (!this.canNoticeBottle(state)) return this.withCat(state, { ...cat, attentionTargetId: null, behaviorElapsedMs: 0 });
        events.push({ type: 'CAT_NOTICED_BOTTLE' });
        return { ...this.withCat(state, { ...cat, behavior: 'noticing-bottle', behaviorElapsedMs: 0 }), status: 'cat-noticed' };
      case 'noticing-bottle':
        events.push({ type: 'CAT_PREPARING_JUMP' });
        return { ...this.withCat(state, { ...cat, behavior: 'preparing-jump', behaviorElapsedMs: 0 }), status: 'cat-preparing' };
      case 'preparing-jump': {
        events.push({ type: 'CAT_JUMPED' });
        const jumpPosition = { x: bottle.position.x - 105, y: bottle.position.y + 145 };
        return { ...this.withCat(state, { ...cat, behavior: 'jumping', behaviorElapsedMs: 0, position: jumpPosition }), status: 'cat-jumping' };
      }
      case 'jumping':
        events.push({ type: 'CAT_LANDED' });
        events.push({ type: 'CAT_TAPPED_BOTTLE' });
        return this.withCat(state, { ...cat, behavior: 'tapping-bottle', behaviorElapsedMs: 0 });
      case 'tapping-bottle': {
        let next = state;
        if (bottle.zoneId === 'desk-surface' && !bottle.isBeingDragged && bottle.orientation === 'upright') {
          events.push({ type: 'BOTTLE_WOBBLED', stabilizedByMat: bottle.isSupportedByMat });
          if (bottle.isSupportedByMat) {
            events.push({ type: 'BOTTLE_STABILIZED_BY_MAT' });
            next = { ...next, status: 'mat-support' };
          } else {
            next = this.withObject(next, { ...bottle, orientation: 'wobbling', effectRemainingMs: this.stage.timings.bottleWobbleMs });
          }
        }
        const pending = next.actors.cat.pendingDistraction;
        if (pending) return this.startDistraction(next, pending, next.objects[pending].position, events, false);
        return this.startReturning(next, events);
      }
      case 'playing-with-toy':
        return this.startReturning(state, events);
      case 'returning': {
        let next = this.withCat(state, {
          ...cat,
          behavior: 'idle',
          behaviorElapsedMs: 0,
          position: { ...cat.homePosition },
          attentionTargetId: null,
          pendingDistraction: null,
        });
        next = this.armBottleReaction(next);
        return next;
      }
      default:
        return state;
    }
  }

  private reconcileGoal(state: WorldState, events: GameEvent[]): WorldState {
    if (state.progressState === 'completed') return state;
    const matches = this.isGoalSatisfied(state);
    const previous = state.goal;
    let next = state;
    if (!matches) {
      if (previous.active || previous.stableForMs > 0) events.push({ type: 'GOAL_STABILITY_RESET' });
      return {
        ...state,
        goal: { ...previous, active: false, stableForMs: 0, progress: 0 },
        progressState: 'playing',
        status: state.status === 'stabilizing' ? 'observing' : state.status,
      };
    }
    if (!previous.active) {
      events.push({ type: 'GOAL_STABILITY_STARTED' });
      next = {
        ...next,
        goal: { ...previous, active: true },
        progressState: 'stabilizing',
        status: this.goalStatus(state),
      };
    }
    const progress = next.goal.stableForMs / next.goal.requiredMs;
    events.push({ type: 'GOAL_STABILITY_UPDATED', progress });
    if (next.goal.stableForMs + EPSILON >= next.goal.requiredMs && this.isGoalSatisfied(next)) {
      events.push({ type: 'STAGE_COMPLETED' });
      const cat = next.actors.cat;
      next = {
        ...next,
        goal: { ...next.goal, active: true, stableForMs: next.goal.requiredMs, progress: 1, completed: true },
        progressState: 'completed',
        status: 'completed',
        actors: { ...next.actors, cat: { ...cat, behavior: 'satisfied', behaviorElapsedMs: 0, attentionTargetId: null, pendingDistraction: null } },
      };
    }
    return next;
  }

  private handleDistraction(state: WorldState, kind: 'cat-food' | 'toy-mouse', position: Position, events: GameEvent[]): WorldState {
    const cat = state.actors.cat;
    if (cat.behavior === 'distracted-by-food' && kind === 'toy-mouse') return state;
    if (cat.behavior === 'jumping' || cat.behavior === 'tapping-bottle') {
      return this.withCat(state, { ...cat, pendingDistraction: kind });
    }
    return this.startDistraction(state, kind, position, events, true);
  }

  private startDistraction(
    state: WorldState,
    kind: 'cat-food' | 'toy-mouse',
    position: Position,
    events: GameEvent[],
    allowCancellation: boolean,
  ): WorldState {
    const cat = state.actors.cat;
    const hadBottleAttack = cat.attentionTargetId === 'bottle' &&
      (cat.behavior === 'idle' || cat.behavior === 'noticing-bottle' || cat.behavior === 'preparing-jump');
    if (allowCancellation && hadBottleAttack) events.push({ type: 'CAT_ATTACK_CANCELLED' });
    events.push(kind === 'cat-food' ? { type: 'CAT_DISTRACTED_BY_FOOD', position } : { type: 'CAT_DISTRACTED_BY_TOY', position });
    return {
      ...this.withCat(state, {
        ...cat,
        behavior: kind === 'cat-food' ? 'distracted-by-food' : 'playing-with-toy',
        behaviorElapsedMs: 0,
        position: { ...position },
        attentionTargetId: kind,
        pendingDistraction: null,
      }),
      status: kind === 'cat-food' ? 'cat-food' : 'cat-toy',
    };
  }

  private startReturning(state: WorldState, events: GameEvent[]): WorldState {
    events.push({ type: 'CAT_RETURNING' });
    const cat = state.actors.cat;
    const next = this.withCat(state, {
      ...cat,
      behavior: 'returning',
      behaviorElapsedMs: 0,
      position: { ...cat.homePosition },
      attentionTargetId: null,
      pendingDistraction: null,
    });
    return { ...next, status: this.goalStatus(next) };
  }

  private goalStatus(state: WorldState): WorldState['status'] {
    if (state.objects.bottle.isSupportedByMat) return 'mat-support';
    if (state.actors.cat.behavior === 'distracted-by-food') return 'cat-food';
    if (state.actors.cat.behavior === 'playing-with-toy') return 'cat-toy';
    return this.isGoalSatisfied(state) ? 'stabilizing' : 'observing';
  }

  private armBottleReaction(state: WorldState): WorldState {
    const bottle = state.objects.bottle;
    const cat = state.actors.cat;
    if (state.progressState === 'completed' || bottle.zoneId !== 'desk-surface' || bottle.orientation !== 'upright' || bottle.isBeingDragged) return state;
    if (cat.behavior === 'distracted-by-food' || cat.behavior === 'playing-with-toy' || cat.behavior === 'jumping' || cat.behavior === 'tapping-bottle') return state;
    if (cat.behavior === 'idle') return this.withCat(state, { ...cat, attentionTargetId: 'bottle', behaviorElapsedMs: 0 });
    if (cat.behavior === 'returning') return this.withCat(state, { ...cat, attentionTargetId: 'bottle' });
    return state;
  }

  private cancelBottleAttackIfPossible(state: WorldState, events: GameEvent[]): WorldState {
    const cat = state.actors.cat;
    if (cat.attentionTargetId !== 'bottle') return state;
    if (cat.behavior !== 'idle' && cat.behavior !== 'noticing-bottle' && cat.behavior !== 'preparing-jump') return state;
    events.push({ type: 'CAT_ATTACK_CANCELLED' });
    return this.withCat(state, { ...cat, behavior: 'idle', behaviorElapsedMs: 0, attentionTargetId: null, position: { ...cat.homePosition } });
  }

  private recomputeSupport(state: WorldState): WorldState {
    const bottle = state.objects.bottle;
    const mat = state.objects['non-slip-mat'];
    const supported = bottle.zoneId === 'desk-surface' && mat.zoneId === 'desk-surface';
    return bottle.isSupportedByMat === supported ? state : this.withObject(state, { ...bottle, isSupportedByMat: supported });
  }

  private refreshInputLocks(state: WorldState): WorldState {
    const cat = state.actors.cat;
    const bottle = state.objects.bottle;
    const completed = state.progressState === 'completed';
    const foodLocked = cat.behavior === 'distracted-by-food' || cat.pendingDistraction === 'cat-food';
    const toyLocked = cat.behavior === 'playing-with-toy' || cat.pendingDistraction === 'toy-mouse';
    const matLocked = bottle.isSupportedByMat && bottle.zoneId === 'desk-surface';
    const objects = Object.fromEntries(Object.entries(state.objects).map(([id, object]) => [id, {
      ...object,
      inputLocked: completed ||
        (object.kind === 'cat-food' && foodLocked) ||
        (object.kind === 'toy-mouse' && toyLocked) ||
        (object.kind === 'non-slip-mat' && matLocked),
    }]));
    return { ...state, objects };
  }

  private isGoalSatisfied(state: WorldState): boolean {
    const object = state.objects[this.stage.goal.objectId];
    return object?.zoneId === this.stage.goal.zoneId && object.orientation === this.stage.goal.orientation && !object.isBeingDragged;
  }

  private canNoticeBottle(state: WorldState): boolean {
    const cat = state.actors.cat;
    const bottle = state.objects.bottle;
    return cat.attentionTargetId === 'bottle' && bottle.zoneId === 'desk-surface' && bottle.orientation === 'upright' && !bottle.isBeingDragged;
  }

  private timeToCatBoundary(state: WorldState): number {
    const cat = state.actors.cat;
    const duration = (() => {
      switch (cat.behavior) {
        case 'idle': return cat.attentionTargetId === 'bottle' ? this.stage.timings.catDetectMs : Number.POSITIVE_INFINITY;
        case 'noticing-bottle': return this.stage.timings.catNoticeMs;
        case 'preparing-jump': return this.stage.timings.catPrepareMs;
        case 'jumping': return this.stage.timings.catJumpMs;
        case 'tapping-bottle': return this.stage.timings.catTapMs;
        case 'playing-with-toy': return this.stage.timings.toyDistractionMs;
        case 'returning': return this.stage.timings.catReturnMs;
        default: return Number.POSITIVE_INFINITY;
      }
    })();
    return Number.isFinite(duration) ? Math.max(0, duration - cat.behaviorElapsedMs) : duration;
  }

  private validateInteraction(state: WorldState, object: ObjectState | undefined): string | undefined {
    if (state.progressState === 'completed') return 'Stage is completed.';
    if (!object) return 'Unknown object id.';
    if (!object.draggable) return `Object is not draggable: ${object.id}`;
    if (object.inputLocked) return `Object input is locked: ${object.id}`;
    return undefined;
  }

  private contains(zone: ZoneDefinition, position: Position): boolean {
    return position.x >= zone.bounds.x && position.x <= zone.bounds.x + zone.bounds.width &&
      position.y >= zone.bounds.y && position.y <= zone.bounds.y + zone.bounds.height;
  }

  private withObject(state: WorldState, object: ObjectState): WorldState {
    return { ...state, objects: { ...state.objects, [object.id]: object } };
  }

  private withCat(state: WorldState, cat: ActorState): WorldState {
    return { ...state, actors: { ...state.actors, cat } };
  }

  private accepted(state: WorldState, events: readonly GameEvent[]): RuleResult {
    return { state, events, accepted: true };
  }

  private rejected(state: WorldState, reason: string): RuleResult {
    return { state, events: [{ type: 'COMMAND_REJECTED', reason }], accepted: false, reason };
  }

  private rejectedDrop(state: WorldState, objectId: ObjectId, reason: string): RuleResult {
    return {
      state,
      events: [{ type: 'OBJECT_DROP_REJECTED', objectId, reason }, { type: 'COMMAND_REJECTED', reason }],
      accepted: false,
      reason,
    };
  }
}
