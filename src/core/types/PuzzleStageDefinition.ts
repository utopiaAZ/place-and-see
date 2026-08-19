import type { GoalDefinition } from '../goals/Goal';
import type { ActorState, ObjectState } from './WorldTypes';
import type { RuleId, StageId } from './identifiers';

export interface PuzzleStageDefinition {
  readonly id: StageId;
  readonly actors: readonly ActorState[];
  readonly objects: readonly ObjectState[];
  readonly activeRuleIds: readonly RuleId[];
  readonly goal: GoalDefinition;
}
