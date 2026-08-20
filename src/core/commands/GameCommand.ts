import type { ObjectId, Position, ZoneId } from '../types/identifiers';

export type GameCommand =
  | { readonly type: 'DROP_OBJECT'; readonly objectId: ObjectId; readonly zoneId: ZoneId; readonly worldPosition: Position }
  | { readonly type: 'PICK_UP_OBJECT'; readonly objectId: ObjectId }
  | { readonly type: 'CANCEL_DRAG'; readonly objectId: ObjectId }
  | { readonly type: 'REPORT_INVALID_DROP'; readonly objectId: ObjectId }
  | { readonly type: 'LIGHT_CANDLE'; readonly lighterId: ObjectId }
  | { readonly type: 'ADVANCE_TIME'; readonly deltaMs: number }
  | { readonly type: 'RESET_STAGE' };

export interface CommandResult {
  readonly accepted: boolean;
  readonly reason?: string;
}
