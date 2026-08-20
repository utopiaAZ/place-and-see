export type StageId = string;
export type ObjectId = string;
export type ActorId = string;
export type RuleId = string;
export type ZoneId =
  | 'floor'
  | 'shelf'
  | 'desk-surface'
  | 'document-desk'
  | 'paper-weight'
  | 'airflow-blocker'
  | 'desk-props'
  | 'plug-socket'
  | 'plug-unplugged';
export type ObjectKind =
  | 'bottle'
  | 'cat-food'
  | 'toy-mouse'
  | 'non-slip-mat'
  | 'document'
  | 'file-divider'
  | 'power-plug';
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
  | 'fan-turning'
  | 'fan-slowing'
  | 'fan-stopped'
  | 'paper-fluttering'
  | 'paper-blown'
  | 'paper-weighted'
  | 'airflow-blocked'
  | 'completed';

export type FanPowerState = 'powered' | 'slowing-down' | 'stopped';
export type FanDirection = 'away' | 'turning-toward-desk' | 'toward-desk' | 'turning-away';
export type PaperState = 'at-initial-position' | 'held' | 'on-desk' | 'fluttering' | 'blown-away' | 'secured';
export type PaperProtection = 'none' | 'weighted-by-bottle' | 'airflow-blocked' | 'fan-stopped';

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface RectangleBounds extends Position {
  readonly width: number;
  readonly height: number;
}
