import type { AudioManifest } from './AudioManifest';
import { STAGE_001_AUDIO_MANIFEST } from './stage001AudioManifest';
import { STAGE_002_AUDIO_MANIFEST } from './stage002AudioManifest';

export const STAGE_001_AND_SHARED_AUDIO_MANIFEST = STAGE_001_AUDIO_MANIFEST;

export const STAGE_002_AND_SHARED_AUDIO_MANIFEST = {
  version: 1,
  sounds: [...STAGE_001_AUDIO_MANIFEST.sounds, ...STAGE_002_AUDIO_MANIFEST.sounds],
} as const satisfies AudioManifest;

export function audioManifestForStage(stageId: string): AudioManifest {
  return stageId === 'stage-002'
    ? STAGE_002_AND_SHARED_AUDIO_MANIFEST
    : STAGE_001_AND_SHARED_AUDIO_MANIFEST;
}
