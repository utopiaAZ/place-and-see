import type {
  ActorId,
  LocationId,
  ObjectCondition,
  ObjectId,
  Position,
  StageId,
} from './identifiers';

export interface ObjectState {
  readonly id: ObjectId;
  readonly kind: string;
  readonly position: Position;
  readonly location: LocationId;
  readonly condition: ObjectCondition;
  readonly graphicKey: string;
  readonly draggable: boolean;
}

export interface ActorState {
  readonly id: ActorId;
  readonly kind: string;
  readonly position: Position;
  readonly attention: 'idle' | 'interested';
  readonly graphicKey: string;
}

export interface GoalProgress {
  readonly active: boolean;
  readonly stableForMs: number;
  readonly requiredMs: number;
  readonly completed: boolean;
}

export interface WorldState {
  readonly stageId: StageId;
  readonly elapsedMs: number;
  readonly objects: Readonly<Record<ObjectId, ObjectState>>;
  readonly actors: Readonly<Record<ActorId, ActorState>>;
  readonly goal: GoalProgress;
}
