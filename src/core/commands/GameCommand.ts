import type { LocationId, ObjectId, Position } from '../types/identifiers';

export type GameCommand =
  | {
      readonly type: 'MOVE_OBJECT';
      readonly objectId: ObjectId;
      readonly position: Position;
      readonly location: LocationId;
    }
  | { readonly type: 'ADVANCE_TIME'; readonly deltaMs: number };

export interface CommandResult {
  readonly accepted: boolean;
  readonly reason?: string;
}
