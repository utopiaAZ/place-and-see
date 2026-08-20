import type { BottleOrientation, ObjectId, ZoneId } from '../types/identifiers';
import type { WorldState } from '../types/WorldTypes';

export interface StableObjectStateGoalDefinition {
  readonly type: 'stable-object-state';
  readonly objectId: ObjectId;
  readonly zoneId: ZoneId;
  readonly orientation: BottleOrientation;
  readonly durationMs: number;
}

export type GoalDefinition = StableObjectStateGoalDefinition;

export interface GoalEvaluation {
  readonly matches: boolean;
  readonly progressMs: number;
  readonly completed: boolean;
}

export interface Goal {
  evaluate(state: WorldState, previousProgressMs: number, deltaMs: number): GoalEvaluation;
}
