import type { GoalDefinition } from '../goals/Goal';
import type { ActorState, ObjectState } from './WorldTypes';
import type { ObjectKind, Position, RectangleBounds, RuleId, StageId, ZoneId } from './identifiers';

export interface ZoneDefinition {
  readonly id: ZoneId;
  readonly type: 'walkable-surface' | 'object-surface';
  readonly bounds: RectangleBounds;
  readonly accepts: readonly ObjectKind[];
  readonly snapPositions?: Readonly<Partial<Record<ObjectKind, Position>>>;
}

export interface StageTimings {
  readonly catDetectMs: number;
  readonly catNoticeMs: number;
  readonly catPrepareMs: number;
  readonly catJumpMs: number;
  readonly catTapMs: number;
  readonly bottleWobbleMs: number;
  readonly catReturnMs: number;
  readonly toyDistractionMs: number;
}

export interface PuzzleStageDefinition {
  readonly id: StageId;
  readonly actors: readonly ActorState[];
  readonly objects: readonly ObjectState[];
  readonly zones: readonly ZoneDefinition[];
  readonly activeRuleIds: readonly RuleId[];
  readonly goal: GoalDefinition;
  readonly timings: StageTimings;
}
