import { isShellStageId, type ShellStageId } from './AppFlow';

export type StageQueryResult =
  | { readonly kind: 'none' }
  | { readonly kind: 'valid'; readonly stageId: ShellStageId }
  | { readonly kind: 'invalid' };

const QUERY_STAGE_IDS: Readonly<Record<string, ShellStageId>> = {
  '001': 'stage-001',
  '002': 'stage-002',
  '003': 'stage-003',
};

export function parseStageQuery(search: string): StageQueryResult {
  const requested = new URLSearchParams(search).get('stage');
  if (requested === null) return { kind: 'none' };
  const stageId = QUERY_STAGE_IDS[requested] ?? (isShellStageId(requested) ? requested : undefined);
  return stageId ? { kind: 'valid', stageId } : { kind: 'invalid' };
}

export function hasDebugQuery(search: string, key: 'audioDebug' | 'debugZones'): boolean {
  return new URLSearchParams(search).get(key) === '1';
}
