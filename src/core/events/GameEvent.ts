import type { LocationId, ObjectId, Position } from '../types/identifiers';
import type { WorldState } from '../types/WorldTypes';

export type GameEvent =
  | { readonly type: 'STATE_CHANGED'; readonly state: WorldState }
  | {
      readonly type: 'OBJECT_MOVED';
      readonly objectId: ObjectId;
      readonly position: Position;
      readonly location: LocationId;
    }
  | { readonly type: 'OBJECT_PLACED'; readonly objectId: ObjectId; readonly location: LocationId }
  | { readonly type: 'ACTOR_SPOTTED_OBJECT'; readonly actorId: string; readonly objectId: ObjectId }
  | { readonly type: 'GOAL_STABILITY_STARTED' }
  | { readonly type: 'GOAL_STABILITY_RESET' }
  | { readonly type: 'GOAL_COMPLETED' }
  | { readonly type: 'STAGE_RESET'; readonly state: WorldState }
  | { readonly type: 'COMMAND_REJECTED'; readonly reason: string };

export type GameEventListener = (event: GameEvent) => void;
