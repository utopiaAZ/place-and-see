export type StageId = string;
export type ObjectId = string;
export type ActorId = string;
export type RuleId = string;
export type ZoneId = 'floor' | 'desk-surface' | 'shelf';
export type ObjectKind = 'bottle' | 'cat-food' | 'toy-mouse' | 'non-slip-mat';
export type BottleOrientation = 'upright' | 'wobbling' | 'fallen';
export type CatBehaviorState =
  | 'idle'
  | 'noticing-bottle'
  | 'preparing-jump'
  | 'jumping'
  | 'tapping-bottle'
  | 'distracted-by-food'
  | 'playing-with-toy'
  | 'returning'
  | 'satisfied';
export type StageProgressState = 'playing' | 'stabilizing' | 'completed';
export type StageStatus =
  | 'observing'
  | 'stabilizing'
  | 'cat-noticed'
  | 'cat-preparing'
  | 'cat-jumping'
  | 'bottle-fell'
  | 'cat-food'
  | 'cat-toy'
  | 'mat-support'
  | 'completed';

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface RectangleBounds extends Position {
  readonly width: number;
  readonly height: number;
}
