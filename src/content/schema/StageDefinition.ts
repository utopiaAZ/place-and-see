import type { PuzzleStageDefinition } from '../../core/types/PuzzleStageDefinition';
import type { SoundEvent } from '../../audio/SoundEventMap';

export interface StageDefinition extends PuzzleStageDefinition {
  readonly mission: { readonly title: string; readonly description: string };
  readonly graphicKeys: readonly string[];
  readonly soundEvents: readonly SoundEvent[];
}
