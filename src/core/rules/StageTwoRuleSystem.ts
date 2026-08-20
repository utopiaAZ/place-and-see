import type { GameEvent } from '../events/GameEvent';
import type { PuzzleStageDefinition, StageTwoDefinition, ZoneDefinition } from '../types/PuzzleStageDefinition';
import type { ObjectState, WorldState } from '../types/WorldTypes';
import type { FanDirection, ObjectId, Position, ZoneId } from '../types/identifiers';
import type { RuleResult } from './StageOneRuleSystem';

export const STAGE_TWO_RULE_ID = 'rule.stage-two-fan-paper';
const EPSILON = 0.0001;

/** Stage 2 rules are deliberately isolated from the cat/bottle rules in StageOneRuleSystem. */
export class StageTwoRuleSystem {
  private readonly config: StageTwoDefinition;

  public constructor(private readonly stage: PuzzleStageDefinition) {
    if (!stage.stageTwo) throw new Error(`Stage ${stage.id} is missing Stage 2 configuration.`);
    this.config = stage.stageTwo;
  }

  public pickUp(state: WorldState, objectId: ObjectId): RuleResult {
    const object = state.objects[objectId];
    const rejection = this.validateInteraction(state, object);
    if (rejection) return this.rejected(state, rejection);
    const events: GameEvent[] = [{ type: 'OBJECT_PICKED_UP', objectId }];
    let next = this.withObject(state, { ...object, isBeingDragged: true });
    if (objectId === this.config.bottleObjectId && state.stageTwo?.paperProtection === 'weighted-by-bottle') {
      events.push({ type: 'PAPER_WEIGHT_REMOVED' });
    }
    if (objectId === this.config.blockerObjectId && state.stageTwo?.airflowBlocked) {
      events.push({ type: 'AIRFLOW_UNBLOCKED' });
    }
    next = this.recomputeProtection(next, events);
    next = this.reconcilePaperAndGoal(next, events);
    return this.accepted(this.refreshInputLocks(next), events);
  }

  public cancelDrag(state: WorldState, objectId: ObjectId): RuleResult {
    const object = state.objects[objectId];
    if (!object) return this.rejected(state, `Unknown object id: ${objectId}`);
    if (!object.isBeingDragged) return this.rejected(state, `Object is not being dragged: ${objectId}`);
    const events: GameEvent[] = [{ type: 'OBJECT_RETURNED', objectId }];
    let next = this.withObject(state, { ...object, isBeingDragged: false });
    next = this.recomputeProtection(next, events);
    next = this.reconcilePaperAndGoal(next, events);
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
    if (objectId === this.config.bottleObjectId && zoneId === this.config.weightZoneId && !this.paperIsOnDesk(state)) {
      return this.rejectedDrop(state, objectId, 'The document must be on the desk before it can be weighted.');
    }

    const position = zone.snapPositions?.[object.kind] ?? worldPosition;
    const events: GameEvent[] = [{ type: 'OBJECT_DROPPED', objectId, zoneId, position }];
    let next = this.withObject(state, {
      ...object,
      position: { ...position },
      zoneId,
      orientation: object.kind === 'bottle' ? 'upright' : object.orientation,
      isBeingDragged: false,
    });

    if (objectId === this.config.documentObjectId) {
      const onDesk = zoneId === this.config.documentZoneId;
      next = this.withStageTwo(next, {
        paperState: onDesk ? 'on-desk' : zoneId === 'floor' ? 'blown-away' : 'at-initial-position',
        paperFlutterElapsedMs: 0,
      });
      if (onDesk) events.push({ type: 'PAPER_PLACED' });
    }
    if (objectId === this.config.plugObjectId && zoneId === this.config.unpluggedZoneId && next.stageTwo?.plugConnected) {
      next = this.withStageTwo(next, {
        plugConnected: false,
        fanPower: 'slowing-down',
        fanSlowdownRemainingMs: this.config.fanSlowdownMs,
      });
      events.push({ type: 'PLUG_UNPLUGGED' }, { type: 'FAN_SLOWING_DOWN' });
    }

    next = this.recomputeProtection(next, events);
    next = this.reconcilePaperAndGoal(next, events);
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
      if (++guard > 200) throw new Error('StageTwoRuleSystem transition guard exceeded.');
      const boundaries = [remaining, this.timeToFanBoundary(next), this.timeToSlowdownBoundary(next), this.timeToFlutterBoundary(next), this.timeToGoalBoundary(next)];
      const segment = Math.min(...boundaries);
      if (segment > EPSILON) {
        next = this.advanceSegment(next, segment);
        remaining -= segment;
      }
      const before = next;
      next = this.processSlowdownBoundary(next, events);
      next = this.processFanBoundary(next, events);
      next = this.processFlutterBoundary(next, events);
      next = this.reconcilePaperAndGoal(next, events);
      if (segment <= EPSILON && next === before) {
        const fallback = Math.min(remaining, 1);
        next = this.advanceSegment(next, fallback);
        remaining -= fallback;
      }
    }
    return this.accepted(this.refreshInputLocks(next), events);
  }

  private advanceSegment(state: WorldState, deltaMs: number): WorldState {
    const stageTwo = this.requiredState(state);
    const goalMatches = this.isGoalSatisfied(state);
    const goalActive = this.paperIsOnDesk(state) && stageTwo.paperState !== 'fluttering';
    const stableForMs = goalMatches ? Math.min(state.goal.requiredMs, state.goal.stableForMs + deltaMs) : 0;
    return {
      ...state,
      elapsedMs: state.elapsedMs + deltaMs,
      stageTwo: {
        ...stageTwo,
        fanPhaseElapsedMs: stageTwo.fanPower === 'powered' ? stageTwo.fanPhaseElapsedMs + deltaMs : stageTwo.fanPhaseElapsedMs,
        fanSlowdownRemainingMs: stageTwo.fanPower === 'slowing-down' ? Math.max(0, stageTwo.fanSlowdownRemainingMs - deltaMs) : stageTwo.fanSlowdownRemainingMs,
        paperFlutterElapsedMs: stageTwo.paperState === 'fluttering' ? stageTwo.paperFlutterElapsedMs + deltaMs : stageTwo.paperFlutterElapsedMs,
      },
      goal: { ...state.goal, active: goalActive, stableForMs, progress: stableForMs / state.goal.requiredMs },
    };
  }

  private processFanBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.fanPower !== 'powered' || detail.fanPhaseElapsedMs + EPSILON < this.config.fanPhaseDurationMs) return state;
    const nextDirection = this.nextDirection(detail.fanDirection);
    let next = this.withStageTwo(state, {
      fanDirection: nextDirection,
      fanPhaseElapsedMs: Math.max(0, detail.fanPhaseElapsedMs - this.config.fanPhaseDurationMs),
    });
    if (nextDirection === 'turning-toward-desk') events.push({ type: 'FAN_TURNED_TOWARD_DESK' });
    if ((nextDirection === 'turning-toward-desk' || nextDirection === 'toward-desk') && this.paperIsOnDesk(next) && !this.hasStructuralProtection(next)) {
      next = this.startFlutter(next, events);
    }
    return next;
  }

  private processSlowdownBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.fanPower !== 'slowing-down' || detail.fanSlowdownRemainingMs > EPSILON) return state;
    let next = this.withStageTwo(state, { fanPower: 'stopped', bladesSpinning: false, fanSlowdownRemainingMs: 0 });
    events.push({ type: 'FAN_STOPPED' });
    if (this.requiredState(next).paperState === 'fluttering') {
      next = this.withStageTwo(next, { paperState: 'on-desk', paperFlutterElapsedMs: 0 });
      events.push({ type: 'PAPER_FLUTTER_STOPPED' });
    }
    return this.recomputeProtection(next, events);
  }

  private processFlutterBoundary(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.paperState !== 'fluttering' || detail.paperFlutterElapsedMs + EPSILON < this.config.paperFlutterMs) return state;
    const paper = state.objects[this.config.documentObjectId];
    let next = this.withObject(state, {
      ...paper,
      position: { ...this.config.blownAwayPosition },
      zoneId: 'floor',
      isBeingDragged: false,
    });
    next = this.withStageTwo(next, { paperState: 'blown-away', paperFlutterElapsedMs: 0, airflowReachesPaper: false });
    events.push({ type: 'PAPER_FLUTTER_STOPPED' }, { type: 'PAPER_BLOWN_AWAY', position: this.config.blownAwayPosition });
    return { ...next, status: 'paper-blown' };
  }

  private reconcilePaperAndGoal(state: WorldState, events: GameEvent[]): WorldState {
    if (state.progressState === 'completed') return state;
    let next = state;
    const detail = this.requiredState(next);
    const reaches = this.paperIsOnDesk(next) && this.fanAimsAtDesk(next) && detail.fanPower !== 'stopped' && !detail.airflowBlocked && detail.paperProtection !== 'weighted-by-bottle';
    if (reaches !== detail.airflowReachesPaper) next = this.withStageTwo(next, { airflowReachesPaper: reaches });
    if (reaches && detail.fanPower === 'powered' && !this.hasStructuralProtection(next)) next = this.startFlutter(next, events);
    if (!reaches && this.requiredState(next).paperState === 'fluttering') {
      next = this.withStageTwo(next, { paperState: 'on-desk', paperFlutterElapsedMs: 0 });
      events.push({ type: 'PAPER_FLUTTER_STOPPED' });
    }

    const onDesk = this.paperIsOnDesk(next) && this.requiredState(next).paperState !== 'fluttering';
    const matches = this.isGoalSatisfied(next);
    if (!onDesk) {
      if (next.goal.active || next.goal.stableForMs > 0) events.push({ type: 'GOAL_STABILITY_RESET' });
      return {
        ...next,
        goal: { ...next.goal, active: false, stableForMs: 0, progress: 0 },
        progressState: 'playing',
        status: this.statusFor(next),
      };
    }
    if (!next.goal.active) {
      events.push({ type: 'GOAL_STABILITY_STARTED' });
      next = { ...next, goal: { ...next.goal, active: true }, progressState: 'stabilizing', status: this.statusFor(next) };
    }
    events.push({ type: 'GOAL_STABILITY_UPDATED', progress: next.goal.stableForMs / next.goal.requiredMs });
    if (matches && next.goal.stableForMs + EPSILON >= next.goal.requiredMs) {
      events.push({ type: 'STAGE_COMPLETED' });
      next = {
        ...next,
        goal: { ...next.goal, active: true, stableForMs: next.goal.requiredMs, progress: 1, completed: true },
        progressState: 'completed',
        status: 'completed',
      };
    }
    return next;
  }

  private recomputeProtection(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    const weighted = this.paperIsOnDesk(state) && state.objects[this.config.bottleObjectId].zoneId === this.config.weightZoneId && !state.objects[this.config.bottleObjectId].isBeingDragged;
    const blocked = state.objects[this.config.blockerObjectId].zoneId === this.config.blockerZoneId && !state.objects[this.config.blockerObjectId].isBeingDragged;
    const protection = detail.fanPower === 'stopped' ? 'fan-stopped' : weighted ? 'weighted-by-bottle' : blocked ? 'airflow-blocked' : 'none';
    if (weighted && detail.paperProtection !== 'weighted-by-bottle') events.push({ type: 'PAPER_WEIGHTED' });
    if (blocked && !detail.airflowBlocked) events.push({ type: 'AIRFLOW_BLOCKED' });
    return this.withStageTwo(state, { paperProtection: protection, airflowBlocked: blocked });
  }

  private startFlutter(state: WorldState, events: GameEvent[]): WorldState {
    const detail = this.requiredState(state);
    if (detail.paperState === 'fluttering' || detail.paperState === 'blown-away') return state;
    events.push({ type: 'PAPER_FLUTTER_STARTED' });
    return { ...this.withStageTwo(state, { paperState: 'fluttering', paperFlutterElapsedMs: 0, airflowReachesPaper: true }), status: 'paper-fluttering' };
  }

  private isGoalSatisfied(state: WorldState): boolean {
    const paper = state.objects[this.config.documentObjectId];
    const detail = this.requiredState(state);
    return paper.zoneId === this.config.documentZoneId && !paper.isBeingDragged && detail.paperState !== 'fluttering' && detail.paperState !== 'blown-away' && this.hasStructuralProtection(state);
  }

  private hasStructuralProtection(state: WorldState): boolean {
    return this.requiredState(state).paperProtection !== 'none';
  }

  private paperIsOnDesk(state: WorldState): boolean {
    const paper = state.objects[this.config.documentObjectId];
    return paper.zoneId === this.config.documentZoneId && !paper.isBeingDragged;
  }

  private fanAimsAtDesk(state: WorldState): boolean {
    const direction = this.requiredState(state).fanDirection;
    return direction === 'turning-toward-desk' || direction === 'toward-desk';
  }

  private timeToFanBoundary(state: WorldState): number {
    const detail = this.requiredState(state);
    return detail.fanPower === 'powered' ? Math.max(0, this.config.fanPhaseDurationMs - detail.fanPhaseElapsedMs) : Number.POSITIVE_INFINITY;
  }

  private timeToSlowdownBoundary(state: WorldState): number {
    const detail = this.requiredState(state);
    return detail.fanPower === 'slowing-down' ? detail.fanSlowdownRemainingMs : Number.POSITIVE_INFINITY;
  }

  private timeToFlutterBoundary(state: WorldState): number {
    const detail = this.requiredState(state);
    return detail.paperState === 'fluttering' ? Math.max(0, this.config.paperFlutterMs - detail.paperFlutterElapsedMs) : Number.POSITIVE_INFINITY;
  }

  private timeToGoalBoundary(state: WorldState): number {
    return this.isGoalSatisfied(state) ? Math.max(0, state.goal.requiredMs - state.goal.stableForMs) : Number.POSITIVE_INFINITY;
  }

  private nextDirection(direction: FanDirection): FanDirection {
    switch (direction) {
      case 'away': return 'turning-toward-desk';
      case 'turning-toward-desk': return 'toward-desk';
      case 'toward-desk': return 'turning-away';
      case 'turning-away': return 'away';
    }
  }

  private statusFor(state: WorldState): WorldState['status'] {
    const detail = this.requiredState(state);
    if (detail.paperState === 'blown-away') return 'paper-blown';
    if (detail.paperState === 'fluttering') return 'paper-fluttering';
    if (detail.paperProtection === 'weighted-by-bottle') return 'paper-weighted';
    if (detail.paperProtection === 'airflow-blocked') return 'airflow-blocked';
    if (detail.fanPower === 'stopped') return 'fan-stopped';
    if (detail.fanPower === 'slowing-down') return 'fan-slowing';
    return 'observing';
  }

  private refreshInputLocks(state: WorldState): WorldState {
    const completed = state.progressState === 'completed';
    const objects = Object.fromEntries(Object.entries(state.objects).map(([id, object]) => [id, { ...object, inputLocked: completed || (id === this.config.plugObjectId && !this.requiredState(state).plugConnected) }]));
    return { ...state, objects };
  }

  private validateInteraction(state: WorldState, object: ObjectState | undefined): string | undefined {
    if (state.progressState === 'completed') return 'Stage is completed.';
    if (!object) return 'Unknown object id.';
    if (!object.draggable) return `Object is not draggable: ${object.id}`;
    if (object.inputLocked) return `Object input is locked: ${object.id}`;
    return undefined;
  }

  private contains(zone: ZoneDefinition, position: Position): boolean {
    return position.x >= zone.bounds.x && position.x <= zone.bounds.x + zone.bounds.width && position.y >= zone.bounds.y && position.y <= zone.bounds.y + zone.bounds.height;
  }

  private requiredState(state: WorldState) {
    if (!state.stageTwo) throw new Error('Stage 2 state is unavailable.');
    return state.stageTwo;
  }

  private withStageTwo(state: WorldState, update: Partial<NonNullable<WorldState['stageTwo']>>): WorldState {
    return { ...state, stageTwo: { ...this.requiredState(state), ...update } };
  }

  private withObject(state: WorldState, object: ObjectState): WorldState {
    return { ...state, objects: { ...state.objects, [object.id]: object } };
  }

  private accepted(state: WorldState, events: readonly GameEvent[]): RuleResult { return { state, events, accepted: true }; }
  private rejected(state: WorldState, reason: string): RuleResult { return { state, events: [{ type: 'COMMAND_REJECTED', reason }], accepted: false, reason }; }
  private rejectedDrop(state: WorldState, objectId: ObjectId, reason: string): RuleResult {
    return { state, events: [{ type: 'OBJECT_DROP_REJECTED', objectId, reason }, { type: 'COMMAND_REJECTED', reason }], accepted: false, reason };
  }
}
