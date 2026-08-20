import type { ObjectId, Position, ZoneId } from '../types/identifiers';
import type { WorldState } from '../types/WorldTypes';

export type GameEvent =
  | { readonly type: 'STATE_CHANGED'; readonly state: WorldState }
  | { readonly type: 'OBJECT_PICKED_UP'; readonly objectId: ObjectId }
  | { readonly type: 'OBJECT_DROPPED'; readonly objectId: ObjectId; readonly zoneId: ZoneId; readonly position: Position }
  | { readonly type: 'OBJECT_RETURNED'; readonly objectId: ObjectId }
  | { readonly type: 'BOTTLE_PLACED_ON_DESK' }
  | { readonly type: 'GOAL_STABILITY_STARTED' }
  | { readonly type: 'GOAL_STABILITY_UPDATED'; readonly progress: number }
  | { readonly type: 'GOAL_STABILITY_RESET' }
  | { readonly type: 'CAT_NOTICED_BOTTLE' }
  | { readonly type: 'CAT_PREPARING_JUMP' }
  | { readonly type: 'CAT_JUMPED' }
  | { readonly type: 'CAT_LANDED' }
  | { readonly type: 'CAT_TAPPED_BOTTLE' }
  | { readonly type: 'BOTTLE_WOBBLED'; readonly stabilizedByMat: boolean }
  | { readonly type: 'BOTTLE_FELL'; readonly position: Position }
  | { readonly type: 'WATER_SPILLED'; readonly position: Position }
  | { readonly type: 'CAT_DISTRACTED_BY_FOOD'; readonly position: Position }
  | { readonly type: 'CAT_DISTRACTED_BY_TOY'; readonly position: Position }
  | { readonly type: 'CAT_ATTACK_CANCELLED' }
  | { readonly type: 'CAT_RETURNING' }
  | { readonly type: 'BOTTLE_STABILIZED_BY_MAT' }
  | { readonly type: 'STAGE_COMPLETED' }
  | { readonly type: 'STAGE_RESET'; readonly state: WorldState }
  | { readonly type: 'OBJECT_DROP_REJECTED'; readonly objectId: ObjectId; readonly reason: string }
  | { readonly type: 'COMMAND_REJECTED'; readonly reason: string };

export type GameEventListener = (event: GameEvent) => void;
