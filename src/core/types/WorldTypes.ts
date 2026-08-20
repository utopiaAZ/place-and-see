import type {
  ActorId,
  BottleOrientation,
  CatBehaviorState,
  ObjectId,
  ObjectKind,
  Position,
  StageId,
  StageProgressState,
  StageStatus,
  ZoneId,
  FanPowerState,
  FanDirection,
  PaperState,
  PaperProtection,
  CakeCondition,
  CakeLocation,
  CandleState,
  CatThreatState,
  AirflowProtection,
} from './identifiers';

export interface ObjectState {
  readonly id: ObjectId;
  readonly kind: ObjectKind;
  readonly position: Position;
  readonly zoneId: ZoneId;
  readonly orientation: BottleOrientation | null;
  readonly isSupportedByMat: boolean;
  readonly effectRemainingMs: number;
  readonly graphicKey: string;
  readonly draggable: boolean;
  readonly inputLocked: boolean;
  readonly isBeingDragged: boolean;
}

export interface ActorState {
  readonly id: ActorId;
  readonly kind: 'cat';
  readonly position: Position;
  readonly homePosition: Position;
  readonly behavior: CatBehaviorState;
  readonly behaviorElapsedMs: number;
  readonly attentionTargetId: ObjectId | null;
  readonly pendingDistraction: 'cat-food' | 'toy-mouse' | null;
  readonly graphicKey: string;
}

export interface GoalProgress {
  readonly active: boolean;
  readonly stableForMs: number;
  readonly requiredMs: number;
  readonly completed: boolean;
  readonly progress: number;
}

export interface WorldState {
  readonly stageId: StageId;
  readonly elapsedMs: number;
  readonly objects: Readonly<Record<ObjectId, ObjectState>>;
  readonly actors: Readonly<Record<ActorId, ActorState>>;
  readonly goal: GoalProgress;
  readonly progressState: StageProgressState;
  readonly status: StageStatus;
  readonly spillVisible: boolean;
  readonly spillPosition: Position | null;
  readonly stageTwo: StageTwoWorldState | null;
  readonly stageThree: StageThreeWorldState | null;
}

export interface StageThreeWorldState {
  readonly cakeCondition: CakeCondition;
  readonly cakeLocation: CakeLocation;
  readonly candleState: CandleState;
  readonly candleTransitionRemainingMs: number;
  readonly catThreat: CatThreatState;
  readonly toyRemainingMs: number;
  readonly fanPower: FanPowerState;
  readonly fanDirection: FanDirection;
  readonly fanPhaseElapsedMs: number;
  readonly fanSlowdownRemainingMs: number;
  readonly bladesSpinning: boolean;
  readonly plugConnected: boolean;
  readonly airflowProtection: AirflowProtection;
  readonly airflowBlocked: boolean;
  readonly airflowReachesCandle: boolean;
}

export interface StageTwoWorldState {
  readonly fanPower: FanPowerState;
  readonly fanDirection: FanDirection;
  readonly fanPhaseElapsedMs: number;
  readonly fanSlowdownRemainingMs: number;
  readonly bladesSpinning: boolean;
  readonly plugConnected: boolean;
  readonly paperState: PaperState;
  readonly paperFlutterElapsedMs: number;
  readonly paperProtection: PaperProtection;
  readonly airflowBlocked: boolean;
  readonly airflowReachesPaper: boolean;
}
