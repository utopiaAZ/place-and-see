export type StageId = string;
export type ObjectId = string;
export type ActorId = string;
export type RuleId = string;
export type LocationId = 'floor' | 'desk' | 'cat-zone';
export type ObjectCondition = 'upright' | 'fallen';

export interface Position {
  readonly x: number;
  readonly y: number;
}
