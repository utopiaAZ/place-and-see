export const STAGE_IDS = ['stage-001', 'stage-002', 'stage-003'] as const;

export type ShellStageId = (typeof STAGE_IDS)[number];

export type AppScreen =
  | 'home'
  | 'stage-select'
  | 'stage-intro'
  | 'stage-loading'
  | 'stage-load-error'
  | 'playing'
  | 'stage-complete'
  | 'demo-complete'
  | 'credits';

export interface AppFlowState {
  readonly screen: AppScreen;
  readonly selectedStageId: ShellStageId | null;
  readonly completedStageIds: readonly ShellStageId[];
  readonly lastPlayedStageId: ShellStageId | null;
}

export interface StageSummary {
  readonly id: ShellStageId;
  readonly number: string;
  readonly englishTitle: string;
  readonly description: string;
  readonly mission: string;
}

export const STAGE_SUMMARIES: readonly StageSummary[] = [
  { id: 'stage-001', number: 'Stage 1', englishTitle: 'Cat & Bottle', description: '고양이 옆에서 물병을 안전하게 놓으세요.', mission: '책상 위에 물병을 안전하게 두세요.' },
  { id: 'stage-002', number: 'Stage 2', englishTitle: 'Fan & Paper', description: '바람 속에서 서류를 안전하게 두세요.', mission: '책상 위에 서류를 안전하게 두세요.' },
  { id: 'stage-003', number: 'Stage 3', englishTitle: 'Cake & Candle', description: '케이크를 지키고 촛불을 켜세요.', mission: '촛불을 켠 케이크를 책상 위에 준비하세요.' },
];

export function isShellStageId(value: unknown): value is ShellStageId {
  return typeof value === 'string' && STAGE_IDS.includes(value as ShellStageId);
}

export function nextStageId(stageId: ShellStageId): ShellStageId | null {
  const index = STAGE_IDS.indexOf(stageId);
  return STAGE_IDS[index + 1] ?? null;
}

export function firstIncompleteStage(completedStageIds: readonly ShellStageId[]): ShellStageId {
  return STAGE_IDS.find((stageId) => !completedStageIds.includes(stageId)) ?? 'stage-001';
}

export function stageSummary(stageId: ShellStageId): StageSummary {
  return STAGE_SUMMARIES.find((stage) => stage.id === stageId)!;
}
