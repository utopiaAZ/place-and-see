import type { StageDefinition } from '../../content/schema/StageDefinition';
import { stage001, stage002, stage003 } from '../../content/stages';
import type { ShellStageId } from './AppFlow';

const STAGES: Readonly<Record<ShellStageId, StageDefinition>> = {
  'stage-001': stage001,
  'stage-002': stage002,
  'stage-003': stage003,
};

export function getStageDefinition(stageId: ShellStageId): StageDefinition {
  return STAGES[stageId];
}
